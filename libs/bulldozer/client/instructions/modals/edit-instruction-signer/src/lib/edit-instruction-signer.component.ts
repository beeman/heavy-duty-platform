import { Component, HostBinding, Inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackBarComponent } from '@bulldozer-client/notification-snack-bar';
import { InstructionAccountDto } from '@heavy-duty/bulldozer-devkit';

@Component({
  selector: 'bd-edit-instruction-signer',
  template: `
    <h2 mat-dialog-title class="mat-primary bd-font">
      {{ signer ? 'Edit' : 'Create' }} signer
    </h2>

    <form
      [formGroup]="form"
      class="flex flex-col gap-4"
      (ngSubmit)="onEditSigner()"
    >
      <mat-form-field
        class="w-full mb-4"
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

      <mat-checkbox formControlName="saveChanges">Save changes.</mat-checkbox>

      <div
        class="py-2 px-5 w-full h-12 bd-bg-metal-2 shadow flex justify-center items-center m-auto mt-4 relative bg-bd-black"
      >
        <button class="bd-button flex-1" mat-dialog-close>Cancel</button>
        <button class="bd-button flex-1" [disabled]="submitted && form.invalid">
          {{ signer ? 'Save' : 'Create' }}
        </button>
        <div
          class="w-2 h-2 rounded-full bg-gray-400 flex items-center justify-center overflow-hidden absolute top-5 left-2"
        >
          <div class="w-full h-px bg-gray-600 rotate-45"></div>
        </div>
        <div
          class="w-2 h-2 rounded-full bg-gray-400 flex items-center justify-center overflow-hidden absolute top-5 right-2"
        >
          <div class="w-full h-px bg-gray-600 rotate-12"></div>
        </div>
      </div>
    </form>
  `,
})
export class EditInstructionSignerComponent {
  @HostBinding('class') class = 'block w-72 relative';
  readonly form: FormGroup;
  submitted = false;

  get nameControl() {
    return this.form.get('name') as FormControl;
  }
  get saveChangesControl() {
    return this.form.get('saveChanges') as FormControl;
  }

  constructor(
    private readonly _matSnackBar: MatSnackBar,
    private readonly _matDialogRef: MatDialogRef<EditInstructionSignerComponent>,
    @Inject(MAT_DIALOG_DATA)
    public signer?: InstructionAccountDto
  ) {
    this.form = new FormGroup({
      name: new FormControl(this.signer?.name ?? '', {
        validators: [Validators.required],
      }),
      saveChanges: new FormControl(this.signer?.modifier === 1),
    });
  }

  onEditSigner() {
    this.submitted = true;
    this.form.markAllAsTouched();

    if (this.form.valid) {
      this._matDialogRef.close({
        name: this.nameControl.value,
        modifier: this.saveChangesControl.value ? 1 : null,
        kind: 1,
        space: null,
        collection: null,
        payer: null,
        close: null,
      });
    } else {
      this._matSnackBar.openFromComponent(SnackBarComponent, {
        duration: 5000,
        data: {
          title: 'Heey...',
          message: 'Invalid Information',
          type: 'warning',
        },
      });
    }
  }
}
