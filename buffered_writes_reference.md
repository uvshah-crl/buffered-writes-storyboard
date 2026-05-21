# CockroachDB Buffered Writes - Technical Reference

**Last Updated:** May 21, 2026  
**Author:** Urvish Shah, Staff Enterprise Architect  
**Purpose:** Customer presentation and technical reference material

---

## Overview

**Buffered Writes** is a transaction optimization feature in CockroachDB that temporarily stores write operations in gateway node memory until transaction commit, rather than immediately sending them to the KV storage layer.

### Version Information

| Version | Default Status | Notes |
|---------|---------------|-------|
| v25.2 | **OFF by default** | Public preview - must be enabled explicitly |
| v26.2+ | **ON by default** | Generally available |

### Session Variable

```sql
-- Enable for current session (v25.2)
SET kv_transaction_buffered_writes_enabled = true;

-- Enable cluster-wide (v25.2)
SET CLUSTER SETTING sql.defaults.transaction_buffered_writes.enabled = true;
```

---

## How It Works

### Without Buffered Writes (v25.2 Default)

1. **Eager Write Intent Creation**: Each SQL write statement immediately creates a write intent in the KV layer
2. **Sequential Network Hops**: 
   - Client → Gateway → Leaseholder → Raft Replicas → Acknowledgment chain back
   - ~7ms per statement (single-region) or ~90ms (multi-region cross-zone)
3. **Heavy Operations**: Uses CPut (Conditional Put) which verifies current value before writing
4. **Redundant Writes Replicated**: If same key updated twice, both updates are sent to KV layer

**Total Latency Example (3 write statements):**
- Single-region: ~21ms for writes + ~5ms commit = **~26ms**
- Multi-region: ~240ms for writes + ~40ms commit = **~280ms**

### With Buffered Writes

1. **Gateway Buffering**: All write operations stored in gateway node memory during transaction
2. **Parallel Flush at COMMIT**: All buffered writes sent simultaneously to respective leaseholders
3. **Simpler Operations**: Uses Put instead of CPut (no conditional check needed)
4. **Redundant Write Elimination**: Only final value for each key sent to storage

**Total Latency Example (3 write statements):**
- Single-region: ~3ms for statements + ~7ms parallel flush = **~10ms** (2.6× faster)
- Multi-region: ~3ms for statements + ~100ms parallel flush = **~103ms** (2.7× faster)

### Key Technical Details

**Two Sub-Optimizations:**

1. **Redundant Write Elimination**  
   Within a single transaction, only the final write operation for each key is sent to storage at commit time

2. **Non-Locking Writes**  
   When `enable_implicit_select_for_update` is active (default), buffered writes can use non-locking Put operations instead of locking CPut operations

**Architecture Changes:**
- Write intents created at COMMIT time, not during statement execution
- Gateway becomes coordinator for buffered state
- Parallel Commits protocol applies to batch flush
- Network round trips reduced from O(n) statements to O(1) commit

---

## Performance Impact

### Published Benchmarks

#### Multi-Region TPC-C (15 nodes)
- **v25.1**: ~20ms SQL latency
- **v25.2**: ~2.24ms SQL latency
- **Improvement**: **9× faster**
- **Source**: [CockroachDB's Resilience Enhanced in 25.2](https://www.cockroachlabs.com/blog/cockroachdbs-resilience-25-2/)

#### Single-Region (9 nodes)
- **Throughput**: 63,100 tpmC
- **v25.1**: ~3ms SQL latency
- **v25.2**: ~1.32ms SQL latency  
- **Improvement**: **2.3× faster**
- **Source**: [CockroachDB's Resilience Enhanced in 25.2](https://www.cockroachlabs.com/blog/cockroachdbs-resilience-25-2/)

#### 300-Node Scale Test (v25.4)
- **Peak Performance**: 2.2M tpmC, 610K QPS @ ~9ms p90 latency (with buffered writes ON)
- **Baseline**: 820K tpmC (without buffered writes)
- **Improvement**: **2.7× throughput increase**
- **Source**: [300-Node Clusters Now Supported in CockroachDB](https://www.cockroachlabs.com/blog/300-node-clusters-supported-cockroachdb/)

### Efficiency Claims

**Official v25.2 Announcement:**
> "CockroachDB 25.2 introduces two major optimizations that improve efficiency by **41%**, enabling businesses to scale more effectively with less hardware"

The two optimizations: **Generic Query Plans** + **Buffered Writes**

**Important Note:** Buffered writes performance improvements are NOT counted towards the baseline 50% improvement discussed in v25.2 benchmarks because it's a preview feature with default setting OFF in v25.2.

**Source**: [CockroachDB's 10-Year Release: Vector Indexing, Performance, and More](https://www.cockroachlabs.com/blog/cockroachdb-252-performance-vector-indexing/)

---

## Ideal Workloads

### ✅ Best Fit

1. **Multi-statement explicit transactions**  
   Primary target use case - transactions with multiple DML statements

2. **Write-heavy workloads**  
   Multiple UPDATE/INSERT/DELETE operations per transaction

3. **Multi-region deployments**  
   Where network latency is most expensive - biggest performance gains

### ⚠️ Limitations

1. **READ COMMITTED isolation not supported (v25.2)**  
   Only works with SERIALIZABLE isolation (CockroachDB default)
   - Support for READ COMMITTED may be added in future releases

2. **Potential retry errors**  
   Some workloads may see increased transaction retry errors
   - Writes are invisible to other transactions until commit
   - Changes contention dynamics

3. **COMMIT becomes heavier**  
   More work happens at COMMIT time vs during statement execution
   - Observability gap: limited tracing/profiling for COMMIT-time work

4. **Gateway memory usage**  
   Very large transactions (millions of rows) may hit memory limits and flush early

5. **Edge cases still being found**  
   As of v25.2-v26.2, edge case bugs being discovered and fixed
   - Fixes unlikely to be backported to older patch releases

### Known Fixed Issues

**SAVEPOINT Bug (Fixed in v25.4 and v26.2):**
Multi-statement explicit transactions using SAVEPOINTs to recover from errors (like duplicate key violations) could lose writes performed before the savepoint in rare cases.

---

## Customer Context

### Why It Was Built

**1. Competitive Gap Identified**  
During Atlassian POC (April 2024), internal engineering analysis revealed: "gateway-buffered writes is the single biggest architectural difference, and explains why CRDB is competitive on oltp_read_only and oltp_insert but less so on oltp_read_write and (especially) oltp_write_only."

This gap drove prioritization of buffered writes feature.

**2. Core Architectural Cost of Distributed Writes**  
Earlier prototype existed but was deprioritized due to contention concerns. The team eventually solved for those concerns and shipped it in v25.2.

### Known Customers Testing (as of early 2026)

- Second Dinner - Interested, validating before adoption (Aug 2025)
- CoinDCX - Evaluating for POC workload (Feb 2025)
- SumUp - Testing on staging for load testing
- OneTrust - Mentioned in perf investigation (Mar 2026) - RC isolation conflict prevented use
- Uber - Performance investigation (Mar 2026)
- Atlassian - Original architectural motivation (Apr 2024 POC)

**Note:** Field teams actively soliciting feedback via internal #ask-the-field channel (Mar 2026)

---

## Customer-Ready Talking Points

### Advantages

1. **"Under-the-covers, no app changes required"**  
   Session/cluster setting flip, no SQL rewrites needed

2. **"Batch your writes, cut your round trips"**  
   Every KV round trip costs latency in distributed systems - buffering eliminates most of them

3. **"Particularly impactful for write-heavy, multi-statement transactions"**  
   Where you'll see the most gain - multi-region sees up to 9× latency reduction

4. **"Significant latency improvements in production"**  
   Up to 9× reduction in multi-region SQL latency (20ms → 2.24ms)

5. **"Lower TCO through improved efficiency"**  
   Same throughput with fewer nodes = lower infrastructure costs

### Implementation Guidance

**For v25.2 Customers:**
- Feature is OFF by default - must enable explicitly
- Recommend testing in staging environment with actual workload first
- Validate with performance benchmarks before production rollout
- Consult with CockroachDB engineering for complex workloads

**For v26.2+ Customers:**
- Feature is ON by default
- If experiencing issues, can disable per-session or cluster-wide
- Monitor for increased retry errors if observed

**READ COMMITTED Users:**
- Wait for future release with READ COMMITTED support
- As of v25.2-v26.2, only SERIALIZABLE isolation supported

---

## Technical Resources

### Official Documentation

- [Transaction Layer Architecture](https://www.cockroachlabs.com/docs/stable/architecture/transaction-layer)
- [Reads and Writes Overview](https://www.cockroachlabs.com/docs/stable/architecture/reads-and-writes-overview)
- [v25.2 Release Notes](https://www.cockroachlabs.com/docs/releases/v25.2)
- [v26.2 Release Notes](https://www.cockroachlabs.com/docs/releases/v26.2)

### Blog Posts & Announcements

- [CockroachDB's Resilience Enhanced in 25.2](https://www.cockroachlabs.com/blog/cockroachdbs-resilience-25-2/) - Dipti Joshi, Performance benchmarks
- [CockroachDB's 10-Year Release: Vector Indexing, Performance, and More](https://www.cockroachlabs.com/blog/cockroachdbs-252-performance-vector-indexing/) - v25.2 launch announcement
- [300-Node Clusters Now Supported in CockroachDB](https://www.cockroachlabs.com/blog/300-node-clusters-supported-cockroachdb/) - v25.4 scale testing

### Related Features

- [Transaction Pipelining](https://www.cockroachlabs.com/blog/transaction-pipelining/) - Earlier optimization for consensus writes
- [Read Committed Transactions](https://www.cockroachlabs.com/docs/stable/read-committed) - Isolation level (not yet supported with buffered writes)

---

## Frequently Asked Questions

### Q: Will buffered writes help my workload?

**A:** Most likely YES if you have:
- Multi-statement explicit transactions (BEGIN...COMMIT blocks)
- Write-heavy workloads with multiple INSERTs/UPDATEs/DELETEs
- Multi-region deployments where network latency is significant
- SERIALIZABLE isolation (CockroachDB default)

**A:** Probably NO if you have:
- Mostly single-statement transactions (autocommit)
- Read-heavy workloads
- READ COMMITTED isolation level (not supported in v25.2-v26.2)

### Q: How do I measure the impact?

**A:** Compare these metrics before/after enabling:
1. SQL statement latency (p50, p90, p99)
2. Transaction commit latency
3. Transaction retry rate
4. Overall application throughput

Focus on multi-statement transaction latency - that's where you'll see the biggest gains.

### Q: What are the risks?

**A:** Potential issues to monitor:
1. **Increased retry errors** - Some workloads may see more retries due to changed contention dynamics
2. **Gateway memory usage** - Very large transactions may consume more gateway memory
3. **COMMIT latency variance** - More work at COMMIT time may show higher p99 latencies
4. **Edge case bugs** - Feature still maturing, edge cases being found and fixed

**Mitigation:** Test thoroughly in staging before production rollout.

### Q: Can I use this with READ COMMITTED isolation?

**A:** Not in v25.2-v26.2. READ COMMITTED support is planned for a future release. Currently only SERIALIZABLE isolation is supported.

### Q: Does this work with single-statement transactions?

**A:** Technically yes, but you won't see meaningful performance improvement. Buffered writes shines with multi-statement transactions where it can batch multiple writes together.

### Q: What happens to observability at COMMIT time?

**A:** Known limitation - there's currently inadequate observability for COMMIT-time work with buffered writes. Tracing and profiling tools don't show detailed breakdown of flush operations. This is being addressed.

---

## Version History

| Version | Status | Key Changes |
|---------|--------|-------------|
| v25.2 | Public Preview, OFF by default | Initial release of buffered writes |
| v25.4 | Public Preview, OFF by default | SAVEPOINT bug fix, 300-node validation |
| v26.2 | Generally Available, ON by default | Feature becomes GA, enabled by default |

---

## Related Internal Context

**PM Ownership:** Dipti Joshi, Staff Product Manager (as of v25.2 release)

**Engineering Context:**  
Per Yahor Yuzefovich (internal): "Simply turning on one cluster setting / session variable might be insufficient as there are others that probably need to be turned on too — consultation with the KV team is warranted" for complex workloads.

**Field Feedback:**  
House of R&D (HRD) actively soliciting field feedback on buffered writes via #ask-the-field internal channel (as of Mar 2026). Customer experience reports are valuable input for product team.

---

## Quick Reference Card

### Enable Buffered Writes (v25.2)

```sql
-- Session-level (recommended for testing)
SET kv_transaction_buffered_writes_enabled = true;

-- Cluster-level (for production)
SET CLUSTER SETTING sql.defaults.transaction_buffered_writes.enabled = true;
```

### Check Current Setting

```sql
SHOW kv_transaction_buffered_writes_enabled;
```

### Performance Quick Comparison

| Metric | Without BW | With BW | Improvement |
|--------|-----------|---------|-------------|
| Multi-region latency (3 writes) | ~280ms | ~103ms | 2.7× faster |
| Single-region latency (3 writes) | ~26ms | ~10ms | 2.6× faster |
| Network round trips | 3 sequential | 1 parallel | O(n) → O(1) |
| Operation type | CPut (heavy) | Put (light) | Simpler ops |

---

**For questions or updates:** Contact Urvish Shah (@urvish.shah)  
**Visual Explainer App:** See `index.html` in this directory
