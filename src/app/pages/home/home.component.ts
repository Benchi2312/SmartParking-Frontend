import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  services = [
    {
      title: 'Vehiculos',
      text: 'Registra y consulta los vehiculos asociados a cada usuario.'
    },
    {
      title: 'Reservas',
      text: 'Crea reservas y revisa el historial desde una sola interfaz.'
    },
    {
      title: 'Espacios',
      text: 'Visualiza el estado de los espacios libres y ocupados en tiempo real.'
    }
  ];
}
