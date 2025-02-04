import { Component, HostBinding, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  BudgetApiService,
  BudgetStore,
} from '@bulldozer-client/budgets-data-access';
import { NotificationStore } from '@bulldozer-client/notifications-data-access';
import { HdBroadcasterSocketStore } from '@heavy-duty/broadcaster';
import {
  DepositToBudgetDto,
  WithdrawFromBudgetDto,
} from '@heavy-duty/bulldozer-devkit';
import { isNotNullOrUndefined } from '@heavy-duty/rxjs';
import { distinctUntilChanged, map } from 'rxjs';
import { ViewWorkspaceBudgetStore } from './view-workspace-budget.store';

@Component({
  selector: 'bd-workspace-details-explorer-budget',
  template: `
    <header class="mb-8">
      <h1 class="text-4xl uppercase mb-1 bd-font">budget</h1>
      <p class="text-sm font-thin mb-0">
        List of the budgets for this workspaces.
      </p>
    </header>

    <main class="flex flex-wrap gap-6" *ngIf="budget$ | ngrxPush as budget">
      <div
        class="flex flex-col gap-2 bd-bg-metal bg-black px-4 py-5 rounded mat-elevation-z8"
      >
        <bd-card class="flex gap-2">
          <figure
            class="w-14 h-14 flex justify-center items-center bg-black rounded-full mr-2"
            *ngIf="!(budget | bdItemChanging)"
          >
            <img
              src="assets/images/solana-logo.webp"
              class="w-1/2"
              width="28"
              height="24"
              alt="Solana Logo"
            />
          </figure>

          <div
            class="w-14 h-14 flex justify-center items-center bg-bd-black rounded-full mr-2"
            *ngIf="budget | bdItemChanging"
          >
            <span
              hdProgressSpinner
              class="h-8 w-8 border-4 border-accent"
            ></span>
          </div>

          <div>
            <p class="m-0 text-sm uppercase">Solana</p>
            <p class="m-0 text-2xl mr-2">
              {{ budget.totalValueLocked | bdFromLamports | number: '1.2-9' }}
              <span class="m-0 text-sm font-thin">SOL</span>
            </p>
          </div>
        </bd-card>
        <ng-container *hdWalletAdapter="let publicKey = publicKey">
          <bd-card class="flex justify-center" *ngIf="publicKey !== null">
            <button
              class="bd-button w-full"
              bdDepositToBudget
              (depositToBudget)="
                onDepositToBudget(
                  publicKey.toBase58(),
                  budget.workspaceId,
                  $event
                )
              "
            >
              Deposit
            </button>
            <button
              class="bd-button w-full"
              bdWithdrawFromBudget
              (withdrawFromBudget)="
                onWithdrawFromBudget(
                  publicKey.toBase58(),
                  budget.workspaceId,
                  $event
                )
              "
            >
              Withdraw
            </button>
          </bd-card>
        </ng-container>
      </div>
    </main>
  `,
  styles: [],
  providers: [BudgetStore, ViewWorkspaceBudgetStore],
})
export class ViewWorkspaceBudgetComponent implements OnInit {
  @HostBinding('class') class = 'block p-8 pt-5 h-full';

  readonly workspaceId$ = this._route.paramMap.pipe(
    map((paramMap) => paramMap.get('workspaceId')),
    isNotNullOrUndefined,
    distinctUntilChanged()
  );
  readonly budget$ = this._viewWorkspaceBudgetStore.budget$;

  constructor(
    private readonly _route: ActivatedRoute,
    private readonly _hdBroadcasterSocketStore: HdBroadcasterSocketStore,
    private readonly _notificationStore: NotificationStore,
    private readonly _budgetApiService: BudgetApiService,
    private readonly _viewWorkspaceBudgetStore: ViewWorkspaceBudgetStore
  ) {}

  ngOnInit() {
    this._viewWorkspaceBudgetStore.setWorkspaceId(
      this._route.paramMap.pipe(map((paramMap) => paramMap.get('workspaceId')))
    );
  }

  onDepositToBudget(
    authority: string,
    workspaceId: string,
    depositToBudgetDto: DepositToBudgetDto
  ) {
    this._budgetApiService
      .depositToBudget({
        authority,
        workspaceId,
        depositToBudgetDto,
      })
      .subscribe({
        next: ({ transactionSignature, transaction }) => {
          this._notificationStore.setEvent('Deposit request sent');
          this._hdBroadcasterSocketStore.send(
            JSON.stringify({
              event: 'transaction',
              data: {
                transactionSignature,
                transaction,
                topicNames: [
                  `authority:${authority}`,
                  `workspace:${workspaceId}:budgets`,
                ],
              },
            })
          );
        },
        error: (error) => {
          this._notificationStore.setError(error);
        },
      });
  }

  onWithdrawFromBudget(
    authority: string,
    workspaceId: string,
    withdrawFromBudgetDto: WithdrawFromBudgetDto
  ) {
    this._budgetApiService
      .withdrawFromBudget({
        authority,
        workspaceId,
        withdrawFromBudgetDto,
      })
      .subscribe({
        next: ({ transactionSignature, transaction }) => {
          this._notificationStore.setEvent('Withdraw request sent');
          this._hdBroadcasterSocketStore.send(
            JSON.stringify({
              event: 'transaction',
              data: {
                transactionSignature,
                transaction,
                topicNames: [
                  `authority:${authority}`,
                  `workspace:${workspaceId}:budgets`,
                ],
              },
            })
          );
        },
        error: (error) => {
          this._notificationStore.setError(error);
        },
      });
  }
}
