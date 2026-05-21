# CockroachDB Buffered Writes - Visual Explainer

An interactive visual storyboard application for explaining CockroachDB's Buffered Writes feature to customers.

## Features

### 📚 Six Interactive Sections

1. **Overview** - Introduction to Buffered Writes with key features
2. **How It Works** - Technical deep dive with animated flow diagrams
3. **Side-by-Side** - Direct comparison with performance metrics
4. **Restaurant Analogy** - Easy-to-understand metaphor for customers
5. **Performance Impact** - Real benchmark data and metrics
6. **Key Takeaways** - Customer talking points and implementation guide

### 🎨 Interactive Elements

- **Tab Navigation** - Switch between sections easily
- **Animated Flow Diagrams** - Click "Animate Flow" to see step-by-step execution
- **Mode Switching** - Toggle between "Without" and "With" Buffered Writes
- **Scenario Comparison** - View single-region vs multi-region performance
- **Click-to-Copy Code** - Click any code block to copy to clipboard
- **Responsive Design** - Works on desktop, tablet, and mobile

### ⌨️ Keyboard Shortcuts

- `←` `→` - Navigate between main tabs
- `Ctrl/Cmd + P` - Print or export to PDF
- `Ctrl/Cmd + Shift + P` - Toggle presentation mode
- `F11` - Toggle fullscreen
- `ESC` - Exit fullscreen
- Click code blocks to copy them

## How to Run

### Option 1: Open Directly in Browser

```bash
# Simply open the HTML file in your browser
open index.html
```

### Option 2: Use a Local Web Server (Recommended)

```bash
# Python 3
python3 -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js (if you have npx)
npx serve

# Then visit: http://localhost:8000
```

## File Structure

```
buffered_writes_storyboard/
├── index.html                      # Main HTML structure
├── styles.css                      # All styling and animations
├── app.js                         # Interactive functionality
├── README.md                      # This file
└── buffered_writes_reference.md   # Complete technical reference with sources
```

## Usage Tips

### For Customer Presentations

1. **Start with Overview** - Introduce the concept and benefits
2. **Show How It Works** - Use the animated flow diagrams
   - Click "Animate Flow" to step through the process
   - Toggle between "Without" and "With" modes for comparison
3. **Use Restaurant Analogy** - Make it relatable for non-technical stakeholders
4. **Show Performance Impact** - Demonstrate real benchmark improvements
5. **End with Key Takeaways** - Provide implementation guidance

### Presentation Mode

Press `Ctrl/Cmd + Shift + P` to enter presentation mode:
- Hides navigation tabs
- Maximizes content area
- Enters fullscreen automatically
- Perfect for customer demos

### Exporting

- **PDF Export**: Press `Ctrl/Cmd + P` or use browser's print function
- **Screenshots**: Use your OS screenshot tool while in presentation mode

## Key Concepts Explained

### Without Buffered Writes
- Every SQL write statement immediately creates write intents in KV layer
- Each write requires a network round trip
- Redundant writes are replicated unnecessarily
- Sequential execution increases latency

### With Buffered Writes
- Writes buffered in gateway memory until COMMIT
- All writes flushed in parallel at commit time
- Redundant writes eliminated before network transmission
- Dramatic latency reduction (up to 9× in multi-region)

## Technical Details

### Performance Improvements
- **Multi-region**: SQL latency ~20ms → ~2.24ms (9× improvement)
- **Single-region**: SQL latency ~3ms → ~1.32ms (2.3× improvement)
- **300-node cluster**: 820K tpmC → 2.2M tpmC with buffered writes

### Ideal Workloads
- Multi-statement explicit transactions
- Write-heavy workloads
- UPDATE/UPSERT/DELETE patterns
- oltp_read_write and oltp_write_only
- Multi-region deployments

### How to Enable

```sql
-- Session-level
SET kv_transaction_buffered_writes_enabled = true;

-- Cluster-level
SET CLUSTER SETTING sql.defaults.transaction_buffered_writes.enabled = true;
```

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Responsive design

## Customization

The app uses CSS variables for easy theming. Edit `styles.css`:

```css
:root {
    --primary-color: #6933FF;
    --secondary-color: #00D4AA;
    --dark-bg: #1A1B26;
    /* ... more variables */
}
```

## Future Enhancements

Potential additions for git repo version:
- [ ] More detailed animations
- [ ] Interactive network latency calculator
- [ ] Customer-specific customization options
- [ ] Multi-language support
- [ ] Video export functionality
- [ ] Embedded demo queries

## Credits

- **Product Manager**: Dipti Joshi, Staff PM at Cockroach Labs
- **Feature Released**: CockroachDB v25.2 (Public Preview)
- **Content Source**: Internal Mica conversation, Confluence, Slack, public docs

## License

Internal use for CockroachDB customer presentations.

---

**For questions or improvements**, contact Urvish Shah (@urvish.shah)
