import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Code from '@tiptap/extension-code';
import Placeholder from '@tiptap/extension-placeholder';

// All toolbar icons as inline SVG for crisp rendering at any size
const icons = {
  bold: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <path d="M3.5 2h3.75c1.38 0 2.5 1.12 2.5 2.5 0 .69-.28 1.315-.73 1.77.92.455 1.55 1.405 1.55 2.48 0 1.52-1.232 2.75-2.75 2.75H3.5V2zm1.5 1.5v2.25h2.25c.552 0 1-.448 1-1s-.448-1-1-1H5zm0 3.75v2.5h2.82c.69 0 1.25-.56 1.25-1.25s-.56-1.25-1.25-1.25H5z"/>
    </svg>
  ),
  italic: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <line x1="10" y1="2" x2="5" y2="12"/>
      <line x1="7" y1="2" x2="12" y2="2"/>
      <line x1="2" y1="12" x2="7" y2="12"/>
    </svg>
  ),
  code: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9,10 12,7 9,4"/>
      <polyline points="5,4 2,7 5,10"/>
    </svg>
  ),
  bullet: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <circle cx="2.5" cy="4" r="1.3"/>
      <circle cx="2.5" cy="7" r="1.3"/>
      <circle cx="2.5" cy="10" r="1.3"/>
      <rect x="5" y="3.2" width="7" height="1.6" rx="0.8"/>
      <rect x="5" y="6.2" width="7" height="1.6" rx="0.8"/>
      <rect x="5" y="9.2" width="7" height="1.6" rx="0.8"/>
    </svg>
  ),
  ordered: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <text x="1" y="5" fontSize="4.5" fontFamily="Inter,sans-serif" fontWeight="600">1.</text>
      <text x="1" y="8.5" fontSize="4.5" fontFamily="Inter,sans-serif" fontWeight="600">2.</text>
      <text x="1" y="12" fontSize="4.5" fontFamily="Inter,sans-serif" fontWeight="600">3.</text>
      <rect x="6" y="3.2" width="7" height="1.6" rx="0.8"/>
      <rect x="6" y="6.7" width="7" height="1.6" rx="0.8"/>
      <rect x="6" y="10.2" width="7" height="1.6" rx="0.8"/>
    </svg>
  ),
};

function TBtn({ onClick, isActive, title, children }) {
  return (
    <button
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      className={isActive ? 'active' : ''}
      title={title}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 26 }}
    >
      {children}
    </button>
  );
}

export default function RichEditor({ content, onChange, cardColor, isDark }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ code: false }),
      Code,
      Placeholder.configure({ placeholder: 'Start writing…' }),
    ],
    content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // Limit content size to prevent storage issues
      if (html.length <= 50000) {
        onChange(html);
      } else {
        console.warn('Content too large, not saving');
      }
    },
  });

  useEffect(() => {
    if (editor && !editor.isFocused && !editor.isDestroyed) {
      const cur = editor.getHTML();
      if (cur !== content) {
        try {
          editor.commands.setContent(content || '', false);
        } catch (err) {
          console.warn('Editor content update failed:', err);
        }
      }
    }
  }, [content, editor]);

  useEffect(() => {
    return () => {
      if (editor && !editor.isDestroyed) {
        try {
          editor.destroy();
        } catch (err) {
          console.warn('Editor cleanup failed:', err);
        }
      }
    };
  }, [editor]);

  if (!editor) return null;

  const labelStyle = { fontWeight: 700, fontSize: 11, lineHeight: 1, fontFamily: 'Inter, sans-serif' };

  return (
    <div className="rich-editor" style={{ color: cardColor?.text }}>
      <div className="editor-toolbar">
        <TBtn onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Bold (⌘B)">
          {icons.bold}
        </TBtn>
        <TBtn onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Italic (⌘I)">
          {icons.italic}
        </TBtn>
        <TBtn onClick={() => editor.chain().focus().toggleCode().run()} isActive={editor.isActive('code')} title="Inline code">
          {icons.code}
        </TBtn>
        <span className="sep" />
        <TBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} title="Heading 1">
          <span style={labelStyle}>H1</span>
        </TBtn>
        <TBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} title="Heading 2">
          <span style={labelStyle}>H2</span>
        </TBtn>
        <TBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })} title="Heading 3">
          <span style={labelStyle}>H3</span>
        </TBtn>
        <span className="sep" />
        <TBtn onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="Bullet list">
          {icons.bullet}
        </TBtn>
        <TBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="Numbered list">
          {icons.ordered}
        </TBtn>
      </div>
      <EditorContent editor={editor} className="editor-content" />
    </div>
  );
}
