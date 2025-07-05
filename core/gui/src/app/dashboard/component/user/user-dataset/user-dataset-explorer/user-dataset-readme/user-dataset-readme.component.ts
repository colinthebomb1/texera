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

import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { DatasetService } from '../../../../../service/user/dataset/dataset.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { NotificationService } from '../../../../../../common/service/notification/notification.service';
import { switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { DatasetFileNode } from '../../../../../../common/type/datasetVersionFileTree';

@UntilDestroy()
@Component({
  selector: 'texera-user-dataset-readme',
  templateUrl: './user-dataset-readme.component.html',
  styleUrls: ['./user-dataset-readme.component.scss']
})
export class UserDatasetReadmeComponent implements OnInit, OnChanges {
  @Input() did: number | undefined;
  @Input() dvid: number | undefined;
  @Input() selectedVersion: any | undefined;
  @Input() datasetName: string = '';
  @Input() isMaximized: boolean = false;
  @Input() userHasWriteAccess: boolean = false;
  @Input() isLogin: boolean = true;
  @Output() userMakeChanges = new EventEmitter<void>();

  public readmeContent: string = '';
  public isEditing: boolean = false;
  public readmeExists: boolean = false;
  public isLoading: boolean = false;
  public editingContent: string = '';

  private readonly README_FILE_PATH = 'README.md';

  // CodeMirror options for markdown editing
  public editorOptions = {
    theme: 'default',
    mode: 'markdown',
    lineNumbers: true,
    lineWrapping: true,
    foldGutter: true,
    gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
    autoCloseBrackets: true,
    matchBrackets: true,
    indentWithTabs: false,
    indentUnit: 2,
    tabSize: 2
  };

  constructor(
      private datasetService: DatasetService,
      private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    if (this.dvid && this.datasetName && this.selectedVersion) {
      this.loadReadme();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Reload README when dataset version changes
    if ((changes['dvid'] || changes['selectedVersion']) &&
        this.dvid && this.selectedVersion) {
      this.loadReadme();
    }
  }

  private loadReadme(): void {
    if (!this.did || !this.dvid || !this.datasetName || !this.selectedVersion) return;

    this.isLoading = true;

    this.datasetService
        .retrieveDatasetVersionFileTree(this.did, this.dvid, this.isLogin)
        .pipe(
            switchMap(({ fileNodes }) => {
              // Check if README.md exists in the file tree
              const readmeExists = this.findReadmeInFileTree(fileNodes);

              if (readmeExists) {
                const fullPath = `/texera/${this.datasetName}/${this.selectedVersion.name}/${this.README_FILE_PATH}`;

                return this.datasetService
                    .retrieveDatasetVersionSingleFile(fullPath, this.isLogin)
                    .pipe(
                        switchMap(blob => {
                          return new Promise<string>((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onload = () => resolve(reader.result as string);
                            reader.onerror = () => reject(reader.error);
                            reader.readAsText(blob);
                          });
                        })
                    );
              } else {
                // README doesn't exist
                return of('');
              }
            }),
            catchError(error => {
              console.log('README not found or error loading:', error);
              return of('');
            }),
            untilDestroyed(this)
        )
        .subscribe({
          next: content => {
            this.isLoading = false;
            if (content) {
              this.readmeExists = true;
              this.readmeContent = content;
              this.editingContent = content;
            } else {
              this.readmeExists = false;
              this.readmeContent = '';
              this.editingContent = '';
            }
          },
          error: () => {
            this.isLoading = false;
            this.readmeExists = false;
            this.readmeContent = '';
            this.editingContent = '';
          }
        });
  }

  private findReadmeInFileTree(fileNodes: DatasetFileNode[]): boolean {
    for (const node of fileNodes) {
      if (node.type === 'file' && node.name === 'README.md') {
        return true;
      }
      if (node.type === 'directory' && node.children) {
        if (this.findReadmeInFileTree(node.children)) {
          return true;
        }
      }
    }
    return false;
  }

  public createReadme(): void {
    if (!this.did || !this.userHasWriteAccess) return;

    const initialContent = '# Dataset README\n\nDescribe your dataset here...';
    this.uploadReadmeContent(initialContent, 'README created successfully');
  }

  public startEditing(): void {
    if (!this.userHasWriteAccess) return;
    this.editingContent = this.readmeContent;
    this.isEditing = true;
  }

  public cancelEditing(): void {
    this.editingContent = this.readmeContent;
    this.isEditing = false;
  }

  public saveReadme(): void {
    if (!this.did || !this.userHasWriteAccess) return;

    this.uploadReadmeContent(this.editingContent, 'README updated successfully');
  }

  public deleteReadme(): void {
    if (!this.did || !this.userHasWriteAccess) return;

    this.datasetService
        .deleteDatasetFile(this.did, this.README_FILE_PATH)
        .pipe(
            // After deleting, create a new version to save changes.
            switchMap(() =>
                this.datasetService.createDatasetVersion(this.did!, 'Deleted README.md')
            ),
            untilDestroyed(this)
        )
        .subscribe({
          next: (newVersion) => {
            this.readmeExists = false;
            this.readmeContent = '';
            this.editingContent = '';
            this.isEditing = false;
            this.notificationService.success('README deleted successfully');

            // Emit the change to refresh file version screen
            this.userMakeChanges.emit();
          },
          error: error => {
            console.error('Error deleting README:', error);
            this.notificationService.error('Failed to delete README');
          }
        });
  }

  private uploadReadmeContent(content: string, successMessage: string): void {
    if (!this.did) return;

    this.datasetService
        .getDataset(this.did, this.isLogin)
        .pipe(
            switchMap(dashboardDataset => {
              const datasetName = dashboardDataset.dataset.name;

              const readmeBlob = new Blob([content], { type: 'text/markdown' });
              const readmeFile = new File([readmeBlob], this.README_FILE_PATH, { type: 'text/markdown' });

              return this.datasetService.multipartUpload(datasetName, this.README_FILE_PATH, readmeFile);
            }),
            // After upload completes, automatically create a new version
            switchMap(progress => {
              if (progress.status === 'finished') {
                const versionMessage = successMessage.includes('created') ? 'Created README.md' : 'Updated README.md';
                return this.datasetService.createDatasetVersion(this.did!, versionMessage);
              }
              return of(progress);
            }),
            untilDestroyed(this)
        )
        .subscribe({
          next: result => {
            if (result && typeof result === 'object' && 'dvid' in result) {
              this.readmeExists = true;
              this.readmeContent = content;
              this.isEditing = false;
              this.notificationService.success(successMessage);

              // Emit the change to refresh file version screen
              this.userMakeChanges.emit();
            }
          },
          error: error => {
            console.error('Error uploading README:', error);
            this.notificationService.error('Failed to save README');
          }
        });
  }
}
