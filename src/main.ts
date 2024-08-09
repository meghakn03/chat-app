import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { AppComponent } from './app/app.component';
import { LoginComponent } from './app/login/login.component';
import { routes } from './app/app.routes'; // Adjust the path as needed

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
  ],
})
.catch((err) => console.error(err));
