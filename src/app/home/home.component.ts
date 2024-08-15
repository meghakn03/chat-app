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
  messages: { 
    text: string; 
    senderId: string; 
    timestamp: Date; 
    recipientId?: string; 
    groupId?: string; 
    fileUrl?: string; // Make fileUrl optional
  }[] = [];
  
    isFriendsListCollapsed: boolean = false;
  showAllUsers: boolean = false;
  searchTerm: string = '';
  loggedInUserId: string | null = null; // To store the logged-in user's ID
  ws: WebSocket | null = null; // WebSocket connection
  message: string = ''; // New property for the message being sent
  creatingGroup: boolean = false; // Flag for group creation mode
  fileUrl: string = ''; // Add fileUrl property
  selectedFileName: string = '';  
  selectedFile: File | null = null;
  notifications: string[] = [];
  groupNotifications: { [key: string]: number } = {}; // Object to store notifications count for each group


  constructor(private router: Router, private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.getLoggedInUser(); // Get logged-in user ID first
    if (this.loggedInUserId) {
      this.loadFriends(); // Call loadFriends() only if user ID is available
      this.loadGroups(); // Load existing groups
      this.fetchUnreadCounts(); // Fetch unread counts
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

  fetchUnreadCounts() {
    this.http.get<{ friendId: string, unreadCount: number }[]>(`http://localhost:4000/api/chats/unread-count/${this.loggedInUserId}`, { headers: this.getAuthHeaders() })
      .subscribe(unreadCounts => {
        this.friends.forEach(friend => {
          const count = unreadCounts.find(c => c.friendId === friend._id);
          friend.unreadCount = count ? count.unreadCount : 0;
        });
      });
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
      if (msg && (msg.text || msg.fileUrl) && msg.senderId) {
        this.messages.push({ ...msg, timestamp: new Date(msg.timestamp) });
        
        // Update unread count if the message is not from the logged-in user
        if (msg.senderId !== this.loggedInUserId) {
          const senderFriend = this.friends.find(f => f._id === msg.senderId);
          if (senderFriend) {
            senderFriend.unreadCount = (senderFriend.unreadCount || 0) + 1;
          }
        }
        
        setTimeout(() => this.scrollToBottom(), 100);
      }
    } catch (e) {
      console.error('Error parsing message:', e);
    }
  }
  
  
  showPopupNotification(message: string) {
    // Store notification message and trigger a badge update
    this.notifications.push(message);
    this.updateBadge();
  }

  updateBadge() {
    // Example implementation: you might want to update a badge UI element
    const badgeElement = document.querySelector('.notification-badge');
    if (badgeElement) {
      badgeElement.textContent = this.notifications.length.toString();
    }
  }
  
  
  // Update group notifications
updateGroupNotifications(groupId: string) {
  if (!this.groupNotifications[groupId]) {
    this.groupNotifications[groupId] = 0;
  }
  this.groupNotifications[groupId]++;
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
    this.selectedGroup = null; // Deselect any selected group
    this.loadChatMessages(friend._id);
  
    // Mark messages as read on the server
    this.http.put(`http://localhost:4000/api/chats/read/${this.loggedInUserId}/${friend._id}`, {}, { headers: this.getAuthHeaders() })
    .subscribe(() => {
      friend.unreadCount = 0;
      this.cdr.detectChanges();
    }, error => {
      console.error('Error marking messages as read:', error);
    });
  
  }
  
  

  selectGroup(group: any) {
    console.log('Selecting group:', group); // Debug log for selecting group
    this.selectedGroup = group;
    this.selectedFriend = null; // Deselect any selected friend
    this.loadChatMessages(group._id);
  
    // Mark group messages as read on the server
    this.http.put('http://localhost:4000/api/groups/mark-read', { userId: this.loggedInUserId, groupId: group._id }, { headers: this.getAuthHeaders() })
      .subscribe(() => {
        // Reset the group notification count in the frontend state immediately
        this.groupNotifications[group._id] = 0;
        this.cdr.detectChanges(); // Trigger change detection to update the UI
      }, error => {
        console.error('Error marking group messages as read:', error);
      });
  }
  
  
  
  
  
  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
  
      this.http.post<{ fileUrl: string }>('http://localhost:4000/api/uploads', formData)
        .subscribe(response => {
          this.fileUrl = response.fileUrl;
          this.selectedFileName = file.name; // Store the file name
        }, error => {
          console.error('Error uploading file:', error);
        });
    }
  }
  
  sendMessage() {
    if (this.message.trim() || this.fileUrl) {
        const msg: any = {
            text: this.message,
            senderId: this.loggedInUserId,
            timestamp: new Date(),
            fileUrl: this.fileUrl
        };

        if (this.selectedFriend) {
            msg.recipientId = this.selectedFriend._id;
            this.http.post('http://localhost:4000/api/chats', msg, { headers: this.getAuthHeaders() })
                .subscribe(response => {
                    if (this.ws) {
                        this.ws.send(JSON.stringify(msg));
                        this.message = '';
                        this.fileUrl = ''; // Reset file URL after sending
                        this.cdr.detectChanges(); // Trigger change detection
                        setTimeout(() => this.scrollToBottom(), 0); // Ensure scroll after DOM update
                    }
                });
        } else if (this.selectedGroup) {
            msg.groupId = this.selectedGroup._id;
            this.http.post(`http://localhost:4000/api/groups/${this.selectedGroup._id}/messages`, msg, { headers: this.getAuthHeaders() })
                .subscribe(response => {
                    if (this.ws) {
                        this.ws.send(JSON.stringify(msg));
                        this.message = '';
                        this.fileUrl = ''; // Reset file URL after sending
                        this.cdr.detectChanges(); // Trigger change detection
                        setTimeout(() => this.scrollToBottom(), 0); // Ensure scroll after DOM update
                    }
                });
        }
        this.message = '';
        this.selectedFile = null;
        this.selectedFileName = '';
    } else {
        alert('Message is empty or no recipient selected.');
    }
}



  getFullFileUrl(fileUrl: string): string {
    return `http://localhost:4000${fileUrl}`;
  }
  

  isImage(fileUrl: string): boolean {
    return fileUrl.match(/\.(jpg|jpeg|png|gif)$/i) !== null;
  }

  isPdf(fileUrl: string): boolean {
    return fileUrl.match(/\.pdf$/i) !== null;
  }

  isDocument(fileUrl: string): boolean {
    return !this.isImage(fileUrl) && !this.isPdf(fileUrl);
  }

  // Update sendMessage to handle both users and groups
  // sendMessage() {
  //   console.log('Message:', this.message);
  //   console.log('Selected Friend:', this.selectedFriend);
  //   console.log('Selected Group:', this.selectedGroup);
  
  //   if (this.message.trim() && (this.selectedFriend || this.selectedGroup) && this.loggedInUserId) {
  //     const msg: any = {
  //       text: this.message,
  //       senderId: this.loggedInUserId,
  //       timestamp: new Date()
  //     };
  
  //     if (this.selectedFriend) {
  //       msg.recipientId = this.selectedFriend._id;
  //       this.http.post('http://localhost:4000/api/chats', msg, { headers: this.getAuthHeaders() })
  //         .subscribe(
  //           response => {
  //             console.log('Message saved successfully:', response);
  //             if (this.ws) {
  //               this.ws.send(JSON.stringify(msg));
  //               this.message = '';
  //               setTimeout(() => this.scrollToBottom(), 0);
  //             }
  //           },
  //           error => {
  //             console.error('Error saving message:', error);
  //             alert('Failed to send message.');
  //           }
  //         );
  //     } else if (this.selectedGroup) {
  //       msg.groupId = this.selectedGroup._id;
  //       this.http.post(`http://localhost:4000/api/groups/${this.selectedGroup._id}/messages`, msg, { headers: this.getAuthHeaders() })
  //         .subscribe(
  //           response => {
  //             console.log('Message saved successfully:', response);
  //             if (this.ws) {
  //               this.ws.send(JSON.stringify(msg));
  //               this.message = '';
  //               setTimeout(() => this.scrollToBottom(), 0);
  //             }
  //           },
  //           error => {
  //             console.error('Error saving message:', error);
  //             alert('Failed to send message.');
  //           }
  //         );
  //     }
  //   } else {
  //     alert('Message is empty or no recipient selected.');
  //   }
  // }
  


  // Update loadChatMessages to handle both users and groups
  loadChatMessages(id: string) {
    if (this.loggedInUserId) {
      const endpoint = this.selectedGroup ? 
        `http://localhost:4000/api/groups/${id}/messages` : 
        `http://localhost:4000/api/chats/${this.loggedInUserId}/${id}`;
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
  
  // selectGroup(group: any) {
  //   console.log('Selecting group:', group); // Add debug log
  //   this.selectedGroup = group;
  //   this.selectedFriend = null; // Deselect any selected friend
  //   this.loadChatMessages(group._id);
  // }
  
  showDropdown: { [key: string]: boolean } = {};

  handleGroupClick(group: any) {
    this.toggleGroupDropdown(group._id);
    this.selectGroup(group);
  }

  toggleGroupDropdown(groupId: string) {
    // Toggle visibility for the selected group
    this.showDropdown[groupId] = !this.showDropdown[groupId];
  }

  isGroupDropdownVisible(groupId: string): boolean {
    return !!this.showDropdown[groupId];
  }

  // Method to get username by ID
  getUsername(userId: string): string {
  const user = this.friends.find(friend => friend._id === userId);
  return user ? user.username : 'Unknown User';
}

// Function to get color based on user ID
getMessageColor(userId: string): string {
  if (!userId) return '#f1f1f1'; // Default color if no user ID
  if (!this.userColors[userId]) {
    // Generate a random light color or choose from a predefined list
    this.userColors[userId] = `hsl(${Math.random() * 360}, 70%, 80%)`;
  }
  return this.userColors[userId];
}

private userColors: { [key: string]: string } = {
  // Example user IDs and their corresponding colors
  'user1': '#FFDDC1', // light peach
  'user2': '#FFABAB', // light pink
  'user3': '#FFC3A0', // light coral
  'user4': '#B9FBC0', // light green
  'user5': '#A2C2E0', // light blue
  'user6': '#B9A0B5', // light purple
  'user7': '#F7B7A3', // light orange
  'user8': '#B8E0D2', // light teal
  'user9': '#E0B2A4', // light tan
  'user10': '#DCE3F2' // light lavender
};

  loadGroups() {
    if (this.loggedInUserId) {
      this.http.get<any[]>(`http://localhost:4000/api/users/${this.loggedInUserId}/groups`, { headers: this.getAuthHeaders() })
        .subscribe(groups => {
          this.groups = groups;
          console.log('Groups loaded:', this.groups);
        }, error => {
          console.error('Error loading groups:', error);
        });
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
      console.warn('No user data found in localStorage.');
    }
  }
}
