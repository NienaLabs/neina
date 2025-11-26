'use client'
import './editor.css'
import { Color } from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import {
    Bold, Code, Heading1, Heading2, Heading3, Highlighter, Italic, List, ListOrdered, Pilcrow, Quote, Redo, Strikethrough, Undo, WrapText, Underline as UnderlineIcon, Link as LinkIcon, Palette, Image as ImageIcon, Table as TableIcon, TextAlignCenter, TextAlignEnd, TextAlignJustify, TextAlignStart, Code2
} from 'lucide-react'
import { Button } from '../ui/button'
import { ButtonGroup, ButtonGroupSeparator } from '../ui/button-group'
import { useTheme } from 'next-themes'
import { TextStyle } from '@tiptap/extension-text-style'
import { FontFamily } from '@tiptap/extension-font-family'
import { Link } from '@tiptap/extension-link'
import { Image } from '@tiptap/extension-image'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'
import { CharacterCount } from '@tiptap/extension-character-count'
import { Placeholder } from '@tiptap/extension-placeholder'
import { TaskList } from '@tiptap/extension-task-list'
import { TaskItem } from '@tiptap/extension-task-item'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'
import { useCallback, useState } from 'react'
import { CodeBlock } from '@tiptap/extension-code-block'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const MenuBar = ({ editor }) => {
    const [linkUrl, setLinkUrl] = useState('')
    const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false)

    const setLink = useCallback(() => {
        const previousUrl = editor.getAttributes('link').href
        setLinkUrl(previousUrl)
        setIsLinkDialogOpen(true)
    }, [editor, setIsLinkDialogOpen, setLinkUrl])

    const handleLinkDialogSave = useCallback(() => {
        if (linkUrl) {
            editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run()
        } else {
            editor.chain().focus().unsetLink().run()
        }
        setIsLinkDialogOpen(false)
        setLinkUrl('')
    }, [editor, linkUrl, setIsLinkDialogOpen, setLinkUrl])


    if (!editor) {
        return null
    }

    return (
        <div className="control-group">
            <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit link</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="link" className="text-right">
                                Link
                            </Label>
                            <Input id="link" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} className="col-span-3" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setIsLinkDialogOpen(false)} variant="outline">Cancel</Button>
                        <Button onClick={handleLinkDialogSave}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <TooltipProvider>
                <ButtonGroup>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
                                <Undo />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Undo</p>
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
                                <Redo />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Redo</p>
                        </TooltipContent>
                    </Tooltip>
                    <ButtonGroupSeparator />
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                                className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
                            >
                                <Heading1 />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Heading 1</p>
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                                className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
                            >
                                <Heading2 />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Heading 2</p>
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                                className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}
                            >
                                <Heading3 />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Heading 3</p>
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                onClick={() => editor.chain().focus().setParagraph().run()}
                                className={editor.isActive('paragraph') ? 'is-active' : ''}
                            >
                                <Pilcrow />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Paragraph</p>
                        </TooltipContent>
                    </Tooltip>
                    <ButtonGroupSeparator />
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                onClick={() => editor.chain().focus().toggleBold().run()}
                                className={editor.isActive('bold') ? 'is-active' : ''}
                            >
                                <Bold />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Bold</p>
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                onClick={() => editor.chain().focus().toggleItalic().run()}
                                className={editor.isActive('italic') ? 'is-active' : ''}
                            >
                                <Italic />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Italic</p>
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                onClick={() => editor.chain().focus().toggleStrike().run()}
                                className={editor.isActive('strike') ? 'is-active' : ''}
                            >
                                <Strikethrough />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Strikethrough</p>
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                onClick={() => editor.chain().focus().toggleUnderline().run()}
                                className={editor.isActive('underline') ? 'is-active' : ''}
                            >
                                <UnderlineIcon />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Underline</p>
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                onClick={() => editor.chain().focus().toggleHighlight().run()}
                                className={editor.isActive('highlight') ? 'is-active' : ''}
                            >
                                <Highlighter />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Highlight</p>
                        </TooltipContent>
                    </Tooltip>
                    <ButtonGroupSeparator />
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                                className={editor.isActive('codeBlock') ? 'is-active' : ''}
                            >
                                <Code2 />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Code block</p>
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button onClick={() => editor.chain().focus().unsetAllMarks().run()}>
                                <WrapText />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Clear formatting</p>
                        </TooltipContent>
                    </Tooltip>
                    <ButtonGroupSeparator />
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                                className={editor.isActive('blockquote') ? 'is-active' : ''}
                            >
                                <Quote />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Blockquote</p>
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                onClick={() => editor.chain().focus().toggleBulletList().run()}
                                className={editor.isActive('bulletList') ? 'is-active' : ''}
                            >
                                <List />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Bullet list</p>
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                                className={editor.isActive('orderedList') ? 'is-active' : ''}
                            >
                                <ListOrdered />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Ordered list</p>
                        </TooltipContent>
                    </Tooltip>
                    <ButtonGroupSeparator />
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                                className={editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''}
                            >
                                <TextAlignStart />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Align left</p>
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                                className={editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''}
                            >
                                <TextAlignCenter />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Align center</p>
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                                className={editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''}
                            >
                                <TextAlignEnd />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Align right</p>
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                                className={editor.isActive({ textAlign: 'justify' }) ? 'is-active' : ''}
                            >
                                <TextAlignJustify />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Justify</p>
                        </TooltipContent>
                    </Tooltip>
                    <ButtonGroupSeparator />
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button onClick={setLink} className={editor.isActive('link') ? 'is-active' : ''}>
                                <LinkIcon />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Add link</p>
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button onClick={() => editor.chain().focus().unsetColor().run()}>
                                <Palette />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Clear color</p>
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <input
                                type="color"
                                onInput={event => editor.chain().focus().setColor(event.target.value).run()}
                                value={editor.getAttributes('textStyle').color}
                            />
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Text color</p>
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                onClick={() => {
                                    const url = window.prompt('URL')
                                    if (url) {
                                        editor.chain().focus().setImage({ src: url }).run()
                                    }
                                }}
                            >
                                <ImageIcon />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Add image</p>
                        </TooltipContent>
                    </Tooltip>
                    <ButtonGroupSeparator />
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                            >
                                <TableIcon />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Insert table</p>
                        </TooltipContent>
                    </Tooltip>
                </ButtonGroup>
            </TooltipProvider>
        </div>
    )
}

export default function TiptapEditor() {
    const { theme } = useTheme()
    const editor = useEditor({
        extensions: [
            StarterKit.configure({}),
            CodeBlock,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Highlight,
            Underline,
            TextStyle,
            FontFamily,
            Color,
            Link.configure({
                openOnClick: false,
            }),
            Image,
            Table.configure({
                resizable: true,
            }),
            TableRow,
            TableHeader,
            TableCell,
            CharacterCount.configure({
                limit: 10000,
            }),
            Placeholder.configure({
                placeholder: 'Write something …',
            }),
            TaskList,
            TaskItem.configure({
                nested: true,
            }),
        ],
        content: `
      <h3 style="text-align:center">
        Devs Just Want to Have Fun by Cyndi Lauper
      </h3>
      <p style="text-align:center">
        I come home in the morning light<br>
        My mother says, <mark>“When you gonna live your life right?”</mark><br>
        Oh mother dear we’re not the fortunate ones<br>
        And devs, they wanna have fun<br>
        Oh devs just want to have fun</p>
      <p style="text-align:center">
        The phone rings in the middle of the night<br>
        My father yells, "What you gonna do with your life?"<br>
        Oh daddy dear, you know you’re still number one<br>
        But <s>girls</s>devs, they wanna have fun<br>
        Oh devs just want to have
      </p>
      <p style="text-align:center">
        That’s all they really want<br>
        Some fun<br>
        When the working day is done<br>
        Oh devs, they wanna have fun<br>
        Oh devs just wanna have fun<br>
        (devs, they wanna, wanna have fun, devs wanna have)
      </p>
    `,
        immediatelyRender: false,
    })

    return (
        <div className="tiptap-editor-wrapper flex items-center flex-col gap-4" data-theme={theme}>
            <MenuBar editor={editor} />
            <EditorContent className="flex flex-1 w-auto h-auto min-w-[60vw]" editor={editor} />
            <div className="character-count">
                {editor ? editor.storage.characterCount.characters() : 0}/10000 characters
                <br />
                {editor ? editor.storage.characterCount.words() : 0} words
            </div>
        </div>
    )
}