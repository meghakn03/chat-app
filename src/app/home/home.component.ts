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
  ws: WebSocket | null = null; // WebSocket connection

  constructor(private router: Router, private http: HttpClient) {}

  ngOnInit() {
    console.log('ngOnInit called'); // Debugging statement
    this.getLoggedInUser(); // Get logged-in user ID first
    if (this.loggedInUserId) {
      this.loadFriends(); // Call loadFriends() only if user ID is available
      this.setupWebSocket();
    } else {
      console.warn('Logged-in user ID is not available.');
    }
  }

  setupWebSocket() {
    // Initialize WebSocket connection
    this.ws = new WebSocket('ws://localhost:4000');
  
    // Handle incoming messages
    this.ws.onmessage = (event) => {
      if (event.data instanceof Blob) {
        // Create a FileReader to read the Blob
        const reader = new FileReader();
        reader.onload = () => {
          const message = reader.result as string;
          this.displayMessage(message);
        };
        reader.readAsText(event.data); // Read Blob as text
      } else {
        // Handle other types of messages if necessary
        this.displayMessage(event.data);
      }
    };
  
    // Handle WebSocket connection open
    this.ws.onopen = () => {
      console.log('WebSocket connection opened');
    };
  
    // Handle WebSocket connection close
    this.ws.onclose = () => {
      console.log('WebSocket connection closed');
    };
  }
  
  private displayMessage(message: string) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('msgCtn');
    msgDiv.innerHTML = message;
    document.querySelector('.chat-messages')?.appendChild(msgDiv);
  }

  getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken'); // Assuming token is stored in localStorage
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  loadFriends() {
    if (this.loggedInUserId) {
        console.log('Fetching friends for user ID:', this.loggedInUserId); // Log the logged-in user ID

        // First, get the friends' IDs
        this.http.get<string[]>(`http://localhost:4000/api/users/${this.loggedInUserId}/friends`, { headers: this.getAuthHeaders() })
            .subscribe(friendIds => {
                console.log('Friend IDs fetched:', friendIds); // Log the fetched friend IDs

                if (friendIds.length > 0) {
                    // Then, get detailed information for these friends
                    this.http.post<any[]>('http://localhost:4000/api/users/by-ids', { ids: friendIds }, { headers: this.getAuthHeaders() })
                        .subscribe(friendsData => {
                            console.log('Friends data fetched:', friendsData); // Log the fetched friends' data
                            this.friends = friendsData;
                            this.filteredFriends = this.friends;
                        }, error => {
                            console.error('Error fetching friends data:', error);
                        });
                } else {
                    console.log('No friends found.'); // Log if no friends are found
                    this.friends = [];
                    this.filteredFriends = [];
                }
            }, error => {
                console.error('Error fetching friends IDs:', error);
            });
    }
  }

  loadAllUsers() {
    this.http.get<any[]>('http://localhost:4000/api/users/all', { headers: this.getAuthHeaders() })
      .subscribe(users => {
        this.allUsers = users;
        this.filteredFriends = this.allUsers.map(user => ({
          ...user,
          isFriend: this.friends.some(friend => friend._id === user._id)
        }));
      });
  }

  searchUsers() {
    const searchQuery = this.searchTerm.trim();
    if (searchQuery) {
      this.http.get<any[]>(`http://localhost:4000/api/users/search?query=${searchQuery}`, { headers: this.getAuthHeaders() })
        .subscribe(users => {
          this.filteredFriends = users.map(user => ({
            ...user,
            isFriend: this.friends.some(friend => friend._id === user._id)
          }));
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
    if (this.message.trim() && this.ws) {
      this.ws.send(this.message);
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
