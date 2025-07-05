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

import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { DatasetService } from '../../../../../service/user/dataset/dataset.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { NotificationService } from '../../../../../../common/service/notification/notification.service';

@UntilDestroy()
@Component({
  selector: 'texera-user-dataset-readme',
  templateUrl: './user-dataset-readme.component.html',
  styleUrls: ['./user-dataset-readme.component.scss']
})
export class UserDatasetReadmeComponent implements OnInit {
  @Input() did: number | undefined;
  @Input() isMaximized: boolean = false;
  @Input() userHasWriteAccess: boolean = false;
  @Output() userMakeChanges = new EventEmitter<void>();

  public readmeContent: string = '';
  public isEditing: boolean = false;
  public readmeExists: boolean = false;
  public isLoading: boolean = false;
  public editingContent: string = '';

  // CodeMirror options
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
      private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadReadme();
  }

  private loadReadme(): void {
    if (!this.did) return;

    this.isLoading = true;
    // For now, simulate loading
    setTimeout(() => {
      this.readmeExists = false;
      this.readmeContent = '';
      this.editingContent = this.readmeContent;
      this.isLoading = false;
    }, 1000);
  }

  public createReadme(): void {
    if (!this.did || !this.userHasWriteAccess) return;

    // Simulate creating README
    this.readmeExists = true;
    this.readmeContent = '# Dataset README\n\nDescribe your dataset here...';
    this.editingContent = this.readmeContent;
    this.isEditing = true;
    this.notificationService.success('README created successfully');
    this.userMakeChanges.emit();
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

    // Simulate saving
    this.readmeContent = this.editingContent;
    this.isEditing = false;
    this.notificationService.success('README updated successfully');
    this.userMakeChanges.emit();
  }

  public deleteReadme(): void {
    if (!this.did || !this.userHasWriteAccess) return;

    // Simulate deletion
    this.readmeExists = false;
    this.readmeContent = '';
    this.editingContent = '';
    this.isEditing = false;
    this.notificationService.success('README deleted successfully');
    this.userMakeChanges.emit();
  }
}
