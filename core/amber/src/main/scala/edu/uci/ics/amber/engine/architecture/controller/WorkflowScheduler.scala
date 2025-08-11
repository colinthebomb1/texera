/*
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

package edu.uci.ics.amber.engine.architecture.controller

import edu.uci.ics.amber.core.virtualidentity.ActorVirtualIdentity
import edu.uci.ics.amber.core.workflow.{PhysicalPlan, WorkflowContext}
import edu.uci.ics.amber.engine.architecture.scheduling.{
  CostBasedScheduleGenerator,
  Region,
  Schedule
}

class WorkflowScheduler(
    workflowContext: WorkflowContext,
    actorId: ActorVirtualIdentity
) extends java.io.Serializable {
  var physicalPlan: PhysicalPlan = _
  private var schedule: Schedule = _

  /**
    * Update the schedule to be executed, based on the given physicalPlan.
    */
  def updateSchedule(physicalPlan: PhysicalPlan): Unit = {
    // generate a schedule using a region plan generator.
    val (generatedSchedule, updatedPhysicalPlan) =
      // CostBasedRegionPlanGenerator considers costs to try to find an optimal plan.
      new CostBasedScheduleGenerator(
        workflowContext,
        physicalPlan,
        actorId
      ).generate()
    this.schedule = generatedSchedule
    this.physicalPlan = updatedPhysicalPlan
  }

  def getNextRegions: Set[Region] = if (!schedule.hasNext) Set() else schedule.next()

}
