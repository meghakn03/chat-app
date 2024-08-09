import { Route } from '@angular/router';
import { LoginComponent } from './login/login.component'; // Adjust the path as needed
import { HomeComponent } from './home/home.component'; // Adjust the path as needed

export const routes: Route[] = [
  { path: '', component: LoginComponent }, // Root path
  { path: 'login', component: LoginComponent }, // Login path
  { path: 'home', component: HomeComponent }, // Login path

  // Add other routes here
];
