/********************************************************************************
 * Copyright (C) 2020 Red Hat, Inc. and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/

import { inject, injectable } from 'inversify';
import { MonacoDiffEditor } from '@theia/monaco/lib/browser/monaco-diff-editor';
import { CommentService } from './commentService';

@injectable()
export class CommentingRangeDecorator {
    @inject(CommentService) private readonly commentService: CommentService;

    async applyDecorations(editor: MonacoDiffEditor): Promise<void> {
        await this.applyDecoration(editor.diffEditor.getOriginalEditor());
        await this.applyDecoration(editor.diffEditor.getModifiedEditor());
    }
    private async applyDecoration(editor: monaco.editor.IStandaloneCodeEditor): Promise<void> {
        const editorURI = editor && editor.getModel()?.uri;
        if (editorURI) {
            const ranges = await this.commentService.getCommentingRanges(editorURI);
            const decorations = ranges.map(range => ({
                range,
                options: {
                    linesDecorationsClassName: 'comment-range-glyph comment-diff-added',
                    isWholeLine: true
                }
            }));
            this.setDecorations(editor, decorations);
        }
    }

    protected readonly appliedDecorations = new Map<string, string[]>();

    protected setDecorations(editor: monaco.editor.ICodeEditor, newDecorations: monaco.editor.IModelDeltaDecoration[]): void {
        const editorId = editor.getId();
        const oldDecorations = this.appliedDecorations.get(editorId) || [];
        if (oldDecorations.length === 0 && newDecorations.length === 0) {
            return;
        }
        const decorationIds = editor.deltaDecorations(oldDecorations, newDecorations);
        this.appliedDecorations.set(editorId, decorationIds);
    }
}
