import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  Inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  Collection,
  Document,
  InstructionAccount,
} from '@heavy-duty/bulldozer-devkit';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'bd-edit-document',
  template: `
    <h2 mat-dialog-title class="mat-primary">
      {{ data?.document ? 'Edit' : 'Create' }} document
    </h2>

    <form
      [formGroup]="documentGroup"
      class="flex flex-col gap-4"
      (ngSubmit)="onEditDocument()"
    >
      <mat-form-field
        class="w-full"
        appearance="fill"
        hintLabel="Enter the name."
      >
        <mat-label>Name</mat-label>
        <input
          matInput
          formControlName="name"
          required
          autocomplete="off"
          maxlength="32"
        />
        <mat-hint align="end">{{ nameControl.value?.length || 0 }}/32</mat-hint>

        <mat-error *ngIf="submitted && nameControl.hasError('required')"
          >The name is mandatory.</mat-error
        >
        <mat-error *ngIf="submitted && nameControl.hasError('maxlength')"
          >Maximum length is 32.</mat-error
        >
      </mat-form-field>

      <mat-form-field
        class="w-full"
        appearance="fill"
        hintLabel="Select a collection."
      >
        <mat-label>Collection</mat-label>
        <mat-select formControlName="collection" required>
          <mat-option
            *ngFor="let collection of data?.collections"
            [value]="collection.id"
          >
            {{ collection.name }} |
            {{ collection.id | obscureAddress }}
          </mat-option>
        </mat-select>
        <mat-error *ngIf="submitted">The collection is required.</mat-error>
      </mat-form-field>

      <mat-radio-group
        class="w-full bg-white bg-opacity-5 px-2 py-1 flex flex-col gap-2"
        ariaLabel="Document modifier"
        formControlName="modifier"
      >
        <mat-radio-button [value]="null">Read-only.</mat-radio-button>
        <mat-radio-button [value]="0">Create new document.</mat-radio-button>
        <mat-radio-button [value]="1">Save changes.</mat-radio-button>
      </mat-radio-group>

      <mat-form-field
        *ngIf="modifierControl.value === 0"
        class="w-full"
        appearance="fill"
        hintLabel="Enter the space."
        autocomplete="off"
      >
        <mat-label>Space</mat-label>
        <input
          matInput
          formControlName="space"
          required
          type="number"
          min="0"
          max="65536"
        />
        <mat-error *ngIf="submitted && spaceControl.hasError('required')"
          >The space is mandatory.</mat-error
        >
        <mat-error *ngIf="submitted && spaceControl.hasError('min')"
          >Space is meant to be positive.</mat-error
        >
        <mat-error *ngIf="submitted && spaceControl.hasError('max')"
          >Maximum is 65536.</mat-error
        >
      </mat-form-field>

      <mat-form-field
        *ngIf="modifierControl.value === 0"
        class="w-full"
        appearance="fill"
        hintLabel="Select a payer."
      >
        <mat-label>Payer</mat-label>
        <mat-select formControlName="payer" required>
          <mat-option
            *ngFor="let account of data?.accounts"
            [value]="account.id"
          >
            {{ account.name }} |
            {{ account.id | obscureAddress }}
          </mat-option>
        </mat-select>
        <mat-error *ngIf="submitted">The payer is required.</mat-error>
      </mat-form-field>

      <mat-form-field
        *ngIf="modifierControl.value === 1"
        class="w-full"
        appearance="fill"
        hintLabel="Select target for close."
      >
        <mat-label>Close</mat-label>
        <mat-select formControlName="close">
          <mat-option> None </mat-option>
          <mat-option
            *ngFor="let account of data?.accounts"
            [value]="account.id"
          >
            {{ account.name }} |
            {{ account.id | obscureAddress }}
          </mat-option>
        </mat-select>
      </mat-form-field>

      <button
        mat-stroked-button
        color="primary"
        class="w-full"
        [disabled]="submitted && documentGroup.invalid"
      >
        {{ data?.document ? 'Save' : 'Create' }}
      </button>
    </form>

    <button
      mat-icon-button
      aria-label="Close edit document form"
      class="w-8 h-8 leading-none absolute top-0 right-0"
      mat-dialog-close
    >
      <mat-icon>close</mat-icon>
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditInstructionDocumentComponent implements OnInit, OnDestroy {
  @HostBinding('class') class = 'block w-72 relative';
  private readonly _destroy = new Subject();
  readonly destroy$ = this._destroy.asObservable();
  submitted = false;
  readonly documentGroup = new FormGroup({
    name: new FormControl('', { validators: [Validators.required] }),
    modifier: new FormControl(null),
    collection: new FormControl(null, { validators: [Validators.required] }),
    space: new FormControl(null),
    payer: new FormControl(null),
    close: new FormControl(null),
  });
  get nameControl() {
    return this.documentGroup.get('name') as FormControl;
  }
  get modifierControl() {
    return this.documentGroup.get('modifier') as FormControl;
  }
  get collectionControl() {
    return this.documentGroup.get('collection') as FormControl;
  }
  get spaceControl() {
    return this.documentGroup.get('space') as FormControl;
  }
  get payerControl() {
    return this.documentGroup.get('payer') as FormControl;
  }
  get closeControl() {
    return this.documentGroup.get('close') as FormControl;
  }

  constructor(
    private readonly _matSnackBar: MatSnackBar,
    private readonly _matDialogRef: MatDialogRef<EditInstructionDocumentComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data?: {
      document?: Document<InstructionAccount>;
      collections: Document<Collection>[];
      accounts: Document<InstructionAccount>[];
    }
  ) {}

  ngOnInit() {
    this.modifierControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((modifier) => {
        if (modifier === 0) {
          this.spaceControl.setValidators([
            Validators.required,
            Validators.min(0),
            Validators.max(65536),
          ]);
          this.payerControl.setValidators([Validators.required]);
        } else {
          this.spaceControl.clearValidators();
          this.payerControl.clearValidators();
        }

        this.spaceControl.updateValueAndValidity();
        this.payerControl.updateValueAndValidity();
      });

    if (this.data?.document) {
      this.documentGroup.setValue(
        {
          name: this.data.document.name,
          modifier:
            this.data.document.data.modifier !== null
              ? this.data.document.data.modifier.id
              : null,
          collection: this.data.document.data.kind.collection || null,
          space: this.data.document.data.modifier?.space || null,
          payer: this.data.document.data.modifier?.payer || null,
          close: this.data.document.data.modifier?.close || null,
        },
        { emitEvent: false }
      );
    }
  }

  ngOnDestroy() {
    this._destroy.next(null);
    this._destroy.complete();
  }

  async onEditDocument() {
    this.submitted = true;
    this.documentGroup.markAllAsTouched();

    if (this.documentGroup.valid) {
      this._matDialogRef.close({
        name: this.nameControl.value,
        kind: 0,
        modifier: this.modifierControl.value,
        collection: this.collectionControl.value,
        space:
          this.modifierControl.value === 0 ? this.spaceControl.value : null,
        payer:
          this.modifierControl.value === 0 ? this.payerControl.value : null,
        close:
          this.modifierControl.value === 1 ? this.closeControl.value : null,
      });
    } else {
      this._matSnackBar.open('Invalid information', 'close', {
        panelClass: 'warning-snackbar',
        duration: 5000,
      });
    }
  }
}