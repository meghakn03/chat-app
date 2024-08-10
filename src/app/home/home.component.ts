import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule], // Add CommonModule and FormsModule here
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  friends: any[] = [];
  allUsers: any[] = [];
  filteredFriends: any[] = [];
  selectedFriend: any = null;
  message: string = '';
  isFriendsListCollapsed: boolean = false;
  showAllUsers: boolean = false;
  searchTerm: string = '';
  loggedInUserId: string | null = null; // To store the logged-in user's ID

  constructor(private router: Router, private http: HttpClient) {}

  ngOnInit() {
    console.log('ngOnInit called'); // Debugging statement
    this.loadFriends();
    this.getLoggedInUser(); // Get logged-in user ID on initialization
  }
  

  getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken'); // Assuming token is stored in localStorage
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  loadFriends() {
    this.http.get<any[]>('/api/friends', { headers: this.getAuthHeaders() })
      .subscribe(friends => {
        this.friends = friends;
        this.filteredFriends = this.friends;
      });
  }

  loadAllUsers() {
    this.http.get<any[]>('http://localhost:4000/api/users/all', { headers: this.getAuthHeaders() })
      .subscribe(users => {
        this.allUsers = users;
        this.filteredFriends = this.allUsers;
      });
  }

  searchUsers() {
    const searchQuery = this.searchTerm.trim();
    if (searchQuery) {
      this.http.get<any[]>(`http://localhost:4000/api/users/search?query=${searchQuery}`, { headers: this.getAuthHeaders() })
        .subscribe(users => {
          this.filteredFriends = users;
        });
    }
  }

  addFriend(user: any) {
    if (this.loggedInUserId) {
      const body = {
        userId: this.loggedInUserId,
        friendId: user._id
      };
      
      this.http.post('http://localhost:4000/api/users/add-friend', body, { headers: this.getAuthHeaders() })
        .subscribe(response => {
          console.log('Friend added successfully:', response);
          alert(`Added ${user.username} as a friend!`);
          // Optionally update the friends list
          this.loadFriends();
        }, error => {
          console.error('Error adding friend:', error);
          alert('Failed to add friend.');
        });
    } else {
      alert('User is not logged in.');
    }
  }

  selectFriend(friend: any) {
    this.selectedFriend = friend;
  }

  sendMessage() {
    if (this.message.trim()) {
      console.log('Sending message:', this.message);
      this.message = '';
    }
  }

  logout() {
    localStorage.removeItem('authToken'); // Clear the token
    this.router.navigate(['/login']);
  }

  goToAccount() {
    console.log('Navigating to account settings...');
  }

  toggleFriendsList() {
    this.isFriendsListCollapsed = !this.isFriendsListCollapsed;
  }

  toggleAllUsers() {
    this.showAllUsers = !this.showAllUsers;
    if (this.showAllUsers) {
      this.loadAllUsers();
    } else {
      this.filteredFriends = this.friends;
    }
  }

  private getLoggedInUser() {
    // Retrieve user data from localStorage
    const userData = localStorage.getItem('userData');
    if (userData) {
      const parsedUserData = JSON.parse(userData);
      this.loggedInUserId = parsedUserData._id;
      console.log('Logged-in user ID:', this.loggedInUserId); // Debugging statement
    } else {
      console.warn('User data not found in localStorage.');
    }
  }
  
}
