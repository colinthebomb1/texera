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

package edu.uci.ics.amber.engine.architecture.controller.promisehandlers

import com.twitter.util.Future
import edu.uci.ics.amber.core.tuple.Tuple
import edu.uci.ics.amber.engine.architecture.controller.{
  ControllerAsyncRPCHandlerInitializer,
  ExecutionStateUpdate,
  ExecutionStatsUpdate
}
import edu.uci.ics.amber.engine.architecture.rpc.controlcommands.{AsyncRPCContext, EmptyRequest}
import edu.uci.ics.amber.engine.architecture.rpc.controlreturns.{EmptyReturn, WorkerMetricsResponse}
import edu.uci.ics.amber.core.virtualidentity.ActorVirtualIdentity

import scala.collection.mutable

/** pause the entire workflow
  *
  * possible sender: client, controller
  */
trait PauseHandler {
  this: ControllerAsyncRPCHandlerInitializer =>

  override def pauseWorkflow(request: EmptyRequest, ctx: AsyncRPCContext): Future[EmptyReturn] = {
    cp.controllerTimerService.disableStatusUpdate() // to be enabled in resume
    Future
      .collect(
        cp.workflowExecution.getRunningRegionExecutions
          .flatMap(_.getAllOperatorExecutions)
          .map {
            case (physicalOpId, opExecution) =>
              // create a buffer for the current input tuple
              // since we need to show them on the frontend
              val buffer = mutable.ArrayBuffer[(Tuple, ActorVirtualIdentity)]()
              Future
                .collect(
                  opExecution.getWorkerIds
                    // send pause to all workers
                    // pause message has no effect on completed or paused workers
                    .map { worker =>
                      val workerExecution = opExecution.getWorkerExecution(worker)
                      // send a pause message
                      workerInterface.pauseWorker(EmptyRequest(), mkContext(worker)).flatMap {
                        resp =>
                          workerExecution.update(System.nanoTime(), resp.state)
                          workerInterface
                            .queryStatistics(EmptyRequest(), mkContext(worker))
                            // get the stats and current input tuple from the worker
                            .map {
                              case WorkerMetricsResponse(metrics) =>
                                workerExecution.update(System.nanoTime(), metrics.workerStatistics)
                            }
                      }
                    }.toSeq
                )
          }
          .toSeq
      )
      .map { _ =>
        // update frontend workflow status
        sendToClient(
          ExecutionStatsUpdate(
            cp.workflowExecution.getAllRegionExecutionsStats
          )
        )
        sendToClient(ExecutionStateUpdate(cp.workflowExecution.getState))
        logger.info(s"workflow paused")
      }
    EmptyReturn()
  }

}
