import { Component, EventEmitter, Output } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-eula-popup",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./eula-popup.component.html",
  styleUrls: ["./eula-popup.component.scss"],
})
export class EulaPopupComponent {
  @Output() agree = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onAgree() {
    this.agree.emit();
  }

  onCancel() {
    this.cancel.emit();
  }
}
