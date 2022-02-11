import { Injectable } from '@angular/core';
import {
  Application,
  ApplicationFilters,
  applicationQueryBuilder,
  BULLDOZER_PROGRAM_ID,
  createApplication,
  createApplicationDocument,
  CreateApplicationParams,
  deleteApplication,
  DeleteApplicationParams,
  Document,
  getBulldozerError,
  updateApplication,
  UpdateApplicationParams,
} from '@heavy-duty/bulldozer-devkit';
import { NgxSolanaApiService } from '@heavy-duty/ngx-solana';
import {
  addInstructionToTransaction,
  partiallySignTransaction,
} from '@heavy-duty/rx-solana';
import { Keypair } from '@solana/web3.js';
import { catchError, concatMap, map, Observable, throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApplicationApiService {
  constructor(private readonly _ngxSolanaApiService: NgxSolanaApiService) {}

  private handleError(error: unknown) {
    return throwError(() =>
      typeof error === 'number' ? getBulldozerError(error) : error
    );
  }

  // get applications
  find(filters: ApplicationFilters) {
    const query = applicationQueryBuilder().where(filters).build();

    return this._ngxSolanaApiService
      .getProgramAccounts(BULLDOZER_PROGRAM_ID.toBase58(), query)
      .pipe(
        map((programAccounts) =>
          programAccounts.map(({ pubkey, account }) =>
            createApplicationDocument(pubkey, account)
          )
        )
      );
  }

  // get application
  findById(applicationId: string): Observable<Document<Application> | null> {
    return this._ngxSolanaApiService
      .getAccountInfo(applicationId)
      .pipe(
        map(
          (accountInfo) =>
            accountInfo && createApplicationDocument(applicationId, accountInfo)
        )
      );
  }

  // create application
  create(params: Omit<CreateApplicationParams, 'applicationId'>) {
    const applicationKeypair = Keypair.generate();

    return this._ngxSolanaApiService.createTransaction(params.authority).pipe(
      addInstructionToTransaction(
        createApplication({
          ...params,
          applicationId: applicationKeypair.publicKey.toBase58(),
        })
      ),
      partiallySignTransaction(applicationKeypair),
      concatMap((transaction) =>
        this._ngxSolanaApiService
          .sendTransaction(transaction)
          .pipe(catchError((error) => this.handleError(error)))
      )
    );
  }

  // update application
  update(params: UpdateApplicationParams) {
    return this._ngxSolanaApiService.createTransaction(params.authority).pipe(
      addInstructionToTransaction(updateApplication(params)),
      concatMap((transaction) =>
        this._ngxSolanaApiService
          .sendTransaction(transaction)
          .pipe(catchError((error) => this.handleError(error)))
      )
    );
  }

  // delete application
  delete(params: DeleteApplicationParams) {
    return this._ngxSolanaApiService.createTransaction(params.authority).pipe(
      addInstructionToTransaction(deleteApplication(params)),
      concatMap((transaction) =>
        this._ngxSolanaApiService
          .sendTransaction(transaction)
          .pipe(catchError((error) => this.handleError(error)))
      )
    );
  }
}