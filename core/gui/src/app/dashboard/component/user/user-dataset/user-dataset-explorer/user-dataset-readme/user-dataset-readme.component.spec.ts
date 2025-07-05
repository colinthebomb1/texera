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

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserDatasetReadmeComponent } from './user-dataset-readme.component';
import { DatasetService } from '../../../../../service/user/dataset/dataset.service';
import { NotificationService } from '../../../../../../common/service/notification/notification.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MarkdownModule } from 'ngx-markdown';
import { FormsModule } from '@angular/forms';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { commonTestProviders } from '../../../../../../common/testing/test-utils';

describe('UserDatasetReadmeComponent', () => {
  let component: UserDatasetReadmeComponent;
  let fixture: ComponentFixture<UserDatasetReadmeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UserDatasetReadmeComponent],
      imports: [
        HttpClientTestingModule,
        MarkdownModule.forRoot(),
        FormsModule,
        NzEmptyModule,
        NzSpinModule,
        NzButtonModule,
        NzAlertModule,
        NzIconModule,
      ],
      providers: [
        DatasetService,
        NotificationService,
        ...commonTestProviders,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserDatasetReadmeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
