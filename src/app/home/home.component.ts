import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChangeDetectorRef } from '@angular/core';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  @ViewChild('chatContainer') chatContainer!: ElementRef; // Reference to chat container
  friends: any[] = [];
  allUsers: any[] = [];
  groups: any[] = []; // Array to hold groups
  filteredFriends: any[] = [];
  selectedFriend: any = null;
  selectedGroup: any = null; // Track selected group
  messages: { text: string, senderId: string, timestamp: Date }[] = []; // Updated messages array
  isFriendsListCollapsed: boolean = false;
  showAllUsers: boolean = false;
  searchTerm: string = '';
  loggedInUserId: string | null = null; // To store the logged-in user's ID
  ws: WebSocket | null = null; // WebSocket connection
  message: string = ''; // New property for the message being sent
  creatingGroup: boolean = false; // Flag for group creation mode

  constructor(private router: Router, private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.getLoggedInUser(); // Get logged-in user ID first
    if (this.loggedInUserId) {
      this.loadFriends(); // Call loadFriends() only if user ID is available
      this.loadGroups(); // Load existing groups
      this.setupWebSocket();
      if (this.selectedFriend) {
        this.loadChatMessages(this.selectedFriend._id);
      }
    } else {
      console.warn('Logged-in user ID is not available.');
    }
  }

  ngAfterViewChecked() {
    // Scroll to bottom after every check
    this.scrollToBottom();
  }

  
  // Scroll to the bottom of the chat
  scrollToBottom(): void {
    try {
      if (this.chatContainer) {
        this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
      }
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
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
    try {
      const msg = JSON.parse(message);
      if (msg && msg.text && msg.senderId) {
        this.messages.push({ ...msg, timestamp: new Date(msg.timestamp) }); // Include timestamp
        this.scrollToBottom(); // Scroll to the bottom after adding the message
      }
    } catch (e) {
      console.error('Error parsing message:', e);
    }
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
    this.loadChatMessages(friend._id);
  }

  

   sendMessage() {
    if (this.message.trim() && this.selectedFriend && this.loggedInUserId) {
      const msg = {
        text: this.message,
        senderId: this.loggedInUserId,
        recipientId: this.selectedFriend._id,
        timestamp: new Date() // Include the current timestamp
      };

      this.http.post('http://localhost:4000/api/chats', msg, { headers: this.getAuthHeaders() })
        .subscribe(
          response => {
            console.log('Message saved successfully:', response);
            if (this.ws) {
              this.ws.send(JSON.stringify(msg));
              this.message = '';
              setTimeout(() => this.scrollToBottom(), 0); // Scroll to bottom after message is sent
            }
          },
          error => {
            console.error('Error saving message:', error);
            alert('Failed to send message.');
          }
        );
    } else {
      alert('Message is empty or no friend selected.');
    }
  }

  loadChatMessages(friendId: string) {
    if (this.loggedInUserId) {
      const endpoint = `http://localhost:4000/api/chats/${this.loggedInUserId}/${friendId}`;
      this.http.get<any[]>(endpoint, { headers: this.getAuthHeaders() })
        .subscribe(messages => {
          this.messages = messages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
          console.log('Chat messages loaded:', messages);
          setTimeout(() => this.scrollToBottom(), 0); // Scroll to bottom after messages are loaded
        }, error => {
          console.error('Error fetching chat messages:', error);
        });
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

  startGroupCreation() {
    this.creatingGroup = true;
    this.filteredFriends.forEach(friend => friend.selected = false); // Reset selections
  }

  createGroup() {
    const selectedFriends = this.filteredFriends.filter(friend => friend.selected);
    if (selectedFriends.length > 0) {
      const groupName = prompt("Enter group name:");
      if (groupName) {
        const newGroup = {
          userId: this.loggedInUserId, // logged-in user's _id
          groupName, // group name entered by the user
          memberIds: selectedFriends.map(friend => friend._id), // array of selected friend's _ids
        };
  
        // Make a POST request to the backend to create the group
        this.http.post('http://localhost:4000/api/groups/create-group', newGroup, { headers: this.getAuthHeaders() })
          .subscribe(
            (response: any) => {
              console.log('Group created successfully:', response.group);
              this.groups.push(response.group); // Add the created group to the list of groups
              this.creatingGroup = false; // Exit group creation mode
              alert('Group created successfully!');
            },
            error => {
              console.error('Error creating group:', error);
              alert('Failed to create group.');
            }
          );
      }
    } else {
      alert("Please select at least one friend to create a group.");
    }
  }
  

  selectGroup(group: any) {
    this.selectedGroup = group;
    this.selectedFriend = null; // Deselect any selected friend
    this.loadChatMessages(group._id); // Load group messages
  }

  loadGroups() {
    // Fetch groups for the logged-in user (to be implemented later with API)
    // Example:
    // this.http.get<any[]>(`http://localhost:4000/api/groups/${this.loggedInUserId}`)
    //   .subscribe(groups => this.groups = groups);
  }


  private getLoggedInUser() {
    // Retrieve user data from localStorage
    const userData = localStorage.getItem('userData');
    if (userData) {
      const parsedUserData = JSON.parse(userData);
      this.loggedInUserId = parsedUserData._id;
      console.log('Logged-in user ID:', this.loggedInUserId); // Debugging statement
    } else {
      console.warn('No user data found in localStorage.');
    }
  }
}
