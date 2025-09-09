import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  ViewEncapsulation,
  ChangeDetectorRef,
} from "@angular/core";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { EditorInstance, EditorOption } from "angular-markdown-editor";
import { MarkdownService } from "ngx-markdown";
import { NotificationService } from "../../../../common/service/notification/notification.service";

@UntilDestroy()
@Component({
  selector: "texera-markdown-description",
  templateUrl: "./markdown-description.component.html",
  styleUrls: ["./markdown-description.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class MarkdownDescriptionComponent implements OnInit, OnChanges {
  @Input() description: string = "";
  @Input() entityName: string = "";
  @Input() entityType: string = "item";
  @Input() editable: boolean = false;
  @Input() maxPreviewLength: number = 200;
  @Input() showInline: boolean = true;

  @Output() descriptionChange = new EventEmitter<string>();
  @Output() editingStateChange = new EventEmitter<boolean>();
  @Output() closeDescription = new EventEmitter<void>();

  public isEditMode: boolean = false;
  public editingContent: string = "";
  public isPreviewMode: boolean = true;
  public renderedDescription: string = '';
  loading: boolean = true;

  // Angular Markdown Editor properties
  public bsEditorInstance!: EditorInstance;
  public editorOptions!: EditorOption;

  constructor(
    private markdownService: MarkdownService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initializeEditorOptions();
    this.editingContent = this.description;
    this.renderMarkdown();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['description'] && !this.isEditMode) {
      this.editingContent = this.description;
      this.renderMarkdown();
    }
  }

  private async renderMarkdown(): Promise<void> {
    try {
      if (this.description && this.description.trim()) {
        const result = this.markdownService.parse(this.description.trim());

        if (result instanceof Promise) {
          this.renderedDescription = await result;
        } else {
          this.renderedDescription = result as string;
        }
      } else {
        this.renderedDescription = '';
      }

      this.loading = false;
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error rendering markdown:', error);
      this.renderedDescription = this.description;
      this.loading = false;
      this.cdr.detectChanges();
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
      onPreview: (e: EditorInstance) => {
        this.togglePreview();
      },
      parser: (val: string) => this.parseMarkdown(val),
    };
  }

  public cancelEditing(): void {
    this.editingContent = this.description;
    this.isEditMode = false;
    this.isPreviewMode = false;
    this.editingStateChange.emit(false);
    this.closeDescription.emit();
  }

  public saveDescription(): void {
    if (this.editingContent.length > 500) {
      console.error("Description cannot exceed 500 characters");
      this.notificationService.error("Description cannot exceed 500 characters");
      return;
    }

    if (this.editingContent !== this.description) {
      this.descriptionChange.emit(this.editingContent);
    }
    this.isEditMode = false;
    this.isPreviewMode = true;
    this.editingStateChange.emit(false);
  }

  public togglePreview(): void {
    this.isPreviewMode = !this.isPreviewMode;
    if (this.isPreviewMode) {
      this.renderPreviewContent();
    }
  }

  private async renderPreviewContent(): Promise<void> {
    try {
      if (this.editingContent && this.editingContent.trim()) {
        const result = this.markdownService.parse(this.editingContent.trim());

        if (result instanceof Promise) {
          this.renderedDescription = await result;
        } else {
          this.renderedDescription = result as string;
        }
      } else {
        this.renderedDescription = '<p><em>Nothing to preview...</em></p>';
      }

      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error rendering preview:', error);
      this.renderedDescription = this.editingContent;
      this.cdr.detectChanges();
    }
  }

  public onMarkdownEditorChange(event: any): void {
    if (event && event.detail && event.detail.eventData) {
      this.editingContent = event.detail.eventData.getContent();
    } else {
      this.editingContent = event;
    }
  }

  public get hasUnsavedChanges(): boolean {
    return this.editingContent !== this.description;
  }

  private parseMarkdown(inputValue: string): string {
    const result = this.markdownService.parse(inputValue.trim());

    if (result instanceof Promise) {
      result.then(parsed => {
        this.highlightCode();
        return parsed;
      });
      return inputValue;
    } else {
      this.highlightCode();
      return result as string;
    }
  }

  private highlightCode(): void {
    setTimeout(() => {
      this.markdownService.highlight();
    });
  }
}
