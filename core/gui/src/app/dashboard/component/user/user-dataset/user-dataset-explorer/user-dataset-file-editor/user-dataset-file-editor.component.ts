/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation,
} from "@angular/core";
import { DatasetService } from "../../../../../service/user/dataset/dataset.service";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { NotificationService } from "../../../../../../common/service/notification/notification.service";
import { switchMap } from "rxjs/operators";
import { of } from "rxjs";
import { EditorInstance, EditorOption } from "angular-markdown-editor";
import { MarkdownService } from "ngx-markdown";


@UntilDestroy()
@Component({
  selector: "texera-user-dataset-file-editor",
  templateUrl: "./user-dataset-file-editor.component.html",
  styleUrls: ["./user-dataset-file-editor.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class UserDatasetFileEditorComponent implements OnInit, OnChanges {
  @Input() did: number | undefined;
  @Input() dvid: number | undefined;
  @Input() selectedVersion: any | undefined;
  @Input() datasetName: string = "";
  @Input() filePath: string = "";
  @Input() isMaximized: boolean = false;
  @Input() userHasWriteAccess: boolean = false;
  @Input() isLogin: boolean = true;
  @Input() chunkSizeMB!: number;
  @Input() maxConcurrentChunks!: number;
  @Input() isEditMode: boolean = true;
  @Output() userMakeChanges = new EventEmitter<void>();
  @Output() editCanceled = new EventEmitter<void>();

  @ViewChild("fileTextarea") fileTextarea!: ElementRef<HTMLTextAreaElement>;

  public fileContent: string = "";
  public fileExists: boolean = false;
  public isLoading: boolean = false;
  public editingContent: string = "";
  public fileType: "markdown" | "text" | "unsupported" = "unsupported";
  public showFileContent: boolean = false;

  // Angular Markdown Editor properties
  public bsEditorInstance!: EditorInstance;
  public editorOptions!: EditorOption;

  constructor(
    private datasetService: DatasetService,
    private notificationService: NotificationService,
    private markdownService: MarkdownService
  ) {}

  ngOnInit(): void {
    this.initializeEditorOptions();

    if (this.dvid && this.datasetName && this.selectedVersion && this.filePath) {
      this.determineFileType();
      this.loadFile();
      this.isEditMode = true;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      (changes["dvid"] || changes["datasetName"] || changes["selectedVersion"] || changes["filePath"]) &&
      this.dvid &&
      this.datasetName &&
      this.selectedVersion &&
      this.filePath
    ) {
      this.isEditMode = false;
      this.showFileContent = false;
      this.isLoading = false;
      this.fileExists = false;
      this.fileContent = "";
      this.editingContent = "";

      this.determineFileType();
      this.loadFile();
    }
  }

  private initializeEditorOptions(): void {
    this.editorOptions = {
      autofocus: false,
      iconlibrary: "fa",
      savable: false,
      onShow: (e: EditorInstance) => {
        this.bsEditorInstance = e;
        console.log("Markdown editor initialized");
      },
      onChange: (e: EditorInstance) => {
        this.editingContent = e.getContent();
      },
      parser: (val: string) => this.parseMarkdown(val),
    };
  }

  private determineFileType(): void {
    const extension = this.filePath.toLowerCase().split(".").pop();
    switch (extension) {
      case "md":
      case "markdown":
        this.fileType = "markdown";
        break;
      case "txt":
      case "log":
      case "yml":
      case "yaml":
        this.fileType = "text";
        break;
      default:
        this.fileType = "unsupported";
    }
  }

  private loadFile(): void {
    if (!this.did || !this.dvid || !this.datasetName || !this.selectedVersion || !this.filePath) return;

    this.isLoading = true;

    this.datasetService
      .retrieveDatasetVersionSingleFile(this.filePath, this.isLogin)
      .pipe(
        switchMap(blob => {
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(reader.error);
            reader.readAsText(blob);
          });
        }),
        untilDestroyed(this)
      )
      .subscribe({
        next: content => {
          this.isLoading = false;
          this.fileExists = true;
          this.fileContent = content;
          this.editingContent = content;
        },
        error: () => {
          this.isLoading = false;
          this.fileExists = false;
          this.fileContent = "";
          this.editingContent = "";
          console.log("File not found or error loading");
        },
      });
  }

  public cancelEditing(): void {
    this.editingContent = this.fileContent;
    this.isEditMode = false;
    this.editCanceled.emit();
  }

  public onMarkdownEditorChange(event: any): void {
    if (event && event.detail && event.detail.eventData) {
      this.editingContent = event.detail.eventData.getContent();
    } else {
      // Handle direct content change
      this.editingContent = event;
    }
  }

  public onEditorKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key === "s") {
      event.preventDefault();
      this.saveFile();
    }

    if (event.key === "Tab") {
      event.preventDefault();
      const textarea = event.target as HTMLTextAreaElement;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      const value = textarea.value;
      textarea.value = value.substring(0, start) + "  " + value.substring(end);

      textarea.selectionStart = textarea.selectionEnd = start + 2;

      this.editingContent = textarea.value;
    }
  }

  public saveFile(): void {
    if (!this.did || !this.userHasWriteAccess) return;

    if (this.editingContent === this.fileContent) {
      this.notificationService.warning("No changes detected in file content");
      return;
    }

    this.uploadFileContent(this.editingContent, `${this.getFileName()} updated successfully`);
  }

  private uploadFileContent(content: string, successMessage: string): void {
    if (!this.did) return;

    this.datasetService
      .getDataset(this.did, this.isLogin)
      .pipe(
        switchMap(dashboardDataset => {
          const datasetName = dashboardDataset.dataset.name;
          const fileName = this.getFileName();

          const mimeType = this.getMimeType();
          const fileBlob = new Blob([content], { type: mimeType });
          const file = new File([fileBlob], fileName, { type: mimeType });

          return this.datasetService.multipartUpload(datasetName, fileName, file, 50 * 1024 * 1024, 10);
        }),
        switchMap(progress => {
          if (progress.status === "finished") {
            const fileName = this.getFileName();
            const versionMessage = successMessage.includes("created") ? `Created ${fileName}` : `Updated ${fileName}`;

            return this.datasetService.createDatasetVersion(this.did!, versionMessage);
          }
          return of(progress);
        }),
        untilDestroyed(this)
      )
      .subscribe({
        next: result => {
          if (result && typeof result === "object" && "dvid" in result) {
            this.fileExists = true;
            this.fileContent = content;
            this.isEditMode = false;
            this.notificationService.success(successMessage);
            this.userMakeChanges.emit();
          }
        },
        error: (error: unknown) => {
          console.error("Error uploading file:", error);
          this.notificationService.error(`Failed to save ${this.getFileName()}`);
        },
      });
  }

  private getMimeType(): string {
    switch (this.fileType) {
      case "markdown":
        return "text/markdown";
      case "text":
        return "text/plain";
      default:
        return "text/plain";
    }
  }

  public getFileName(): string {
    if (!this.filePath) return "";
    return this.filePath.split("/").pop() || this.filePath;
  }

  public isEditable(): boolean {
    return this.fileType === "markdown" || this.fileType === "text";
  }

  public hasUnsavedChanges(): boolean {
    return this.editingContent !== this.fileContent;
  }

  private async parseMarkdownAsync(inputValue: string): Promise<string> {
    try {
      const result = this.markdownService.parse(inputValue.trim());

      if (result instanceof Promise) {
        return await result;
      } else {
        return result as string;
      }
    } catch (error) {
      console.error('Error parsing markdown:', error);
      return inputValue;
    }
  }

  private parseMarkdown(inputValue: string): string {
    // For the editor preview, we need to handle async rendering
    this.parseMarkdownAsync(inputValue).then(rendered => {
      // Update the preview manually after async parsing
      if (this.bsEditorInstance) {
        // Force update the preview pane
        const previewElement = document.querySelector('.md-preview');
        if (previewElement) {
          previewElement.innerHTML = rendered;
        }
      }
    });

    // Return a temporary placeholder while processing
    return '<p><em>Rendering markdown...</em></p>';
  }

  private highlightCode(): void {
    setTimeout(() => {
      this.markdownService.highlight();
    });
  }
}
