import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service'; // Adjust the path if necessary
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common'; // Ensure CommonModule is imported

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [
    CommonModule, // Include CommonModule to use directives like NgIf
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ]
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  username: string = '';
  isRegistering: boolean = false;

  constructor(private authService: AuthService, private router: Router) {}

  toggleForm() {
    this.isRegistering = !this.isRegistering;
  }

  onLogin() {
    this.authService.login(this.email, this.password).subscribe(response => {
      console.log('Login successful:', response);
      alert(`Login successful! Your user ID is: ${response.user._id}`);
      
      // Store user data in localStorage
      localStorage.setItem('authToken', response.token); // Store the token
      localStorage.setItem('userData', JSON.stringify(response.user)); // Store user data
  
      this.router.navigate(['/home']); // Redirect to home or another page
    }, error => {
      console.error('Login error:', error);
    });
  }
  
  onRegister() {
    this.authService.register(this.email, this.password, this.username).subscribe(response => {
      console.log('Registration successful:', response);
      alert(`Registration successful! Your user ID is: ${response.user._id}`);
      this.isRegistering = false; // Switch to login form
    }, error => {
      console.error('Registration error:', error);
    });
  }
  
}
