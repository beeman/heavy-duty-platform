import {
  Directive,
  EventEmitter,
  HostListener,
  Input,
  Output,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UserDto } from '@heavy-duty/bulldozer-devkit';
import { EditUserComponent } from './edit-user.component';

@Directive({ selector: '[bdEditUser]' })
export class EditUserDirective {
  @Input() user?: UserDto;
  @Output() editUser = new EventEmitter<UserDto>();
  @HostListener('click') onClick(): void {
    this._matDialog
      .open<EditUserComponent, UserDto, UserDto>(EditUserComponent, {
        data: this.user,
        panelClass: ['bd-bg-wood', 'bg-bd-brown'],
      })
      .afterClosed()
      .subscribe((data) => data && this.editUser.emit(data));
  }

  constructor(private readonly _matDialog: MatDialog) {}
}
