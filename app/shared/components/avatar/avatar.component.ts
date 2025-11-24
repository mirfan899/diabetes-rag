import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-avatar",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./avatar.component.html",
  styleUrls: ["./avatar.component.scss"],
})
export class AvatarComponent {
  @Input() firstName: string = "";
  @Input() lastName: string = "";
  @Input() imageUrl?: string;
  @Input() size: number = 40;

  private colors = [
    "#2563eb", // blue
    "#059669", // green
    "#dc2626", // red
    "#7c3aed", // purple
    "#ea580c", // orange
    "#0891b2", // cyan
    "#be185d", // pink
  ];

  get initials(): string {
    const first = this.firstName?.charAt(0) || "";
    const last = this.lastName?.charAt(0) || "";
    return first + last;
  }

  get altText(): string {
    return `${this.firstName} ${this.lastName}'s avatar`;
  }

  get backgroundColor(): string {
    // Generate a consistent color based on the name
    const combinedName = this.firstName + this.lastName;
    const index =
      Math.abs(
        combinedName
          .split("")
          .reduce((acc, char) => acc + char.charCodeAt(0), 0),
      ) % this.colors.length;

    return this.colors[index];
  }
}
