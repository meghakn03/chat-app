import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common'; // Import CommonModule
import { FormsModule } from '@angular/forms'; // Import FormsModule

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  imports: [
    CommonModule, // Include CommonModule to use directives like NgFor
    FormsModule // Include FormsModule to use ngModel
  ]
})
export class HomeComponent {
  friends = [
    { name: 'John Doe' },
    { name: 'Jane Smith' }
    // Add more friends as needed
  ];
  selectedFriend: any = null;
  message: string = '';
  isFriendsListCollapsed: boolean = false;


  constructor(private router: Router) {}

  selectFriend(friend: any) {
    this.selectedFriend = friend;
    // Load chat history for the selected friend if needed
  }

  sendMessage() {
    if (this.message.trim()) {
      console.log('Sending message:', this.message);
      // Add message sending logic here
      this.message = '';
    }
  }

  logout() {
    // Implement logout logic
    console.log('Logging out...');
    this.router.navigate(['/login']);
  }

  goToAccount() {
    // Navigate to account settings page if needed
    console.log('Navigating to account settings...');
  }

  toggleFriendsList() {
    this.isFriendsListCollapsed = !this.isFriendsListCollapsed;
  }
}
