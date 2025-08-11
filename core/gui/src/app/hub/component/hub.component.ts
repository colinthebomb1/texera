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

import { Component, Input } from "@angular/core";
import {
  DASHBOARD_HOME,
  DASHBOARD_HUB_WORKFLOW_RESULT,
  DASHBOARD_HUB_DATASET_RESULT,
} from "../../app-routing.constant";
import { GuiConfigService } from "../../common/service/gui-config.service";
import { SidebarTabs } from "../../common/type/gui-config";

@Component({
  selector: "texera-hub",
  templateUrl: "hub.component.html",
  styleUrls: ["hub.component.scss"],
})
export class HubComponent {
  @Input() isLogin: boolean = false;
  @Input() sidebarTabs: SidebarTabs = {} as SidebarTabs;
  protected readonly DASHBOARD_HOME = DASHBOARD_HOME;
  protected readonly DASHBOARD_HUB_WORKFLOW_RESULT = DASHBOARD_HUB_WORKFLOW_RESULT;
  protected readonly DASHBOARD_HUB_DATASET_RESULT = DASHBOARD_HUB_DATASET_RESULT;

  constructor(protected config: GuiConfigService) {}
}
