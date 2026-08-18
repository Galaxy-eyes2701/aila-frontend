import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import ConfirmModal from "@presentation/components/ConfirmModal/ConfirmModal";
import styles from "./RichTextEditor.module.css";

const TEXT_COLORS = ["#111827", "#dc2626", "#2563eb", "#16a34a", "#ca8a04", "#7c3aed"];
const HIGHLIGHT_COLORS = ["#fef08a", "#bbf7d0", "#bfdbfe", "#fecaca", "#e9d5ff"];

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Nhập nội dung...",
  disabled = false,
  onImageUpload,
}) {
  const fileInputRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false, autolink: true }),
      Image.configure({ inline: false, HTMLAttributes: { class: styles.editorImage } }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    editable: !disabled,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  // Đồng bộ khi value được set từ bên ngoài (vd: sau khi load dữ liệu từ API)
  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value || "", false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [disabled, editor]);

  if (!editor) return null;

  function setLink() {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Nhập đường dẫn liên kết:", previousUrl || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  function insertImage() {
    if (onImageUpload) {
      fileInputRef.current?.click();
      return;
    }
    const url = window.prompt("Nhập URL ảnh:", "https://");
    if (!url) return;
    editor.chain().focus().setImage({ src: url }).run();
  }

  const [uploadError, setUploadError] = useState(false);

  async function handleFileSelected(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // cho phép chọn lại cùng 1 file lần sau
    if (!file) return;

    try {
      const url = await onImageUpload(file);
      if (url) editor.chain().focus().setImage({ src: url }).run();
    } catch (err) {
      setUploadError(true);
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <button
          type="button"
          className={editor.isActive("bold") ? styles.active : ""}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="In đậm"
        >
          <i className="fas fa-bold" />
        </button>
        <button
          type="button"
          className={editor.isActive("italic") ? styles.active : ""}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="In nghiêng"
        >
          <i className="fas fa-italic" />
        </button>
        <button
          type="button"
          className={editor.isActive("underline") ? styles.active : ""}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Gạch chân"
        >
          <i className="fas fa-underline" />
        </button>
        <button
          type="button"
          className={editor.isActive("strike") ? styles.active : ""}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Gạch ngang"
        >
          <i className="fas fa-strikethrough" />
        </button>

        <span className={styles.divider} />

        <button
          type="button"
          className={editor.isActive("heading", { level: 2 }) ? styles.active : ""}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Tiêu đề"
        >
          <i className="fas fa-heading" />
        </button>
        <button
          type="button"
          className={editor.isActive("bulletList") ? styles.active : ""}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Danh sách chấm"
        >
          <i className="fas fa-list-ul" />
        </button>
        <button
          type="button"
          className={editor.isActive("orderedList") ? styles.active : ""}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Danh sách số"
        >
          <i className="fas fa-list-ol" />
        </button>
        <button
          type="button"
          className={editor.isActive("blockquote") ? styles.active : ""}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Trích dẫn"
        >
          <i className="fas fa-quote-left" />
        </button>
        <button
          type="button"
          className={editor.isActive("link") ? styles.active : ""}
          onClick={setLink}
          title="Chèn liên kết"
        >
          <i className="fas fa-link" />
        </button>
        <button type="button" onClick={insertImage} title="Chèn ảnh">
          <i className="fas fa-image" />
        </button>
        {onImageUpload && (
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className={styles.hiddenFileInput}
            onChange={handleFileSelected}
          />
        )}

        <span className={styles.divider} />

        <div className={styles.colorGroup} title="Màu chữ">
          <i className="fas fa-font" />
          {TEXT_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={styles.colorSwatch}
              style={{ backgroundColor: color }}
              onClick={() => editor.chain().focus().setColor(color).run()}
            />
          ))}
          <button
            type="button"
            className={styles.colorReset}
            onClick={() => editor.chain().focus().unsetColor().run()}
            title="Bỏ màu chữ"
          >
            <i className="fas fa-eraser" />
          </button>
        </div>

        <div className={styles.colorGroup} title="Màu nền chữ">
          <i className="fas fa-highlighter" />
          {HIGHLIGHT_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={styles.colorSwatch}
              style={{ backgroundColor: color }}
              onClick={() => editor.chain().focus().toggleHighlight({ color }).run()}
            />
          ))}
          <button
            type="button"
            className={styles.colorReset}
            onClick={() => editor.chain().focus().unsetHighlight().run()}
            title="Bỏ màu nền"
          >
            <i className="fas fa-eraser" />
          </button>
        </div>

        <span className={styles.divider} />

        <button type="button" onClick={() => editor.chain().focus().undo().run()} title="Hoàn tác">
          <i className="fas fa-rotate-left" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().redo().run()} title="Làm lại">
          <i className="fas fa-rotate-right" />
        </button>
      </div>

      <EditorContent editor={editor} className={styles.editorContent} />

      {uploadError && (
        <ConfirmModal
          open={uploadError}
          title="Tải ảnh thất bại"
          description="Không thể tải ảnh lên tập tin. Vui lòng kiểm tra dung lượng và định dạng ảnh rồi thử lại."
          tone="danger"
          confirmLabel="Đã hiểu"
          cancelLabel="Đóng"
          icon="fa-circle-exclamation"
          onConfirm={() => setUploadError(false)}
          onClose={() => setUploadError(false)}
        />
      )}
    </div>
  );
}