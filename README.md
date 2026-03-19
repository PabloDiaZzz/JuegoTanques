# 🎯 Tank Game

¡Bienvenido a este juego de artillería por turnos! Controla tu tanque, domina las físicas del terreno, calcula la trayectoria de tus disparos y destruye a tus oponentes antes de que ellos te destruyan a ti.

## 🎮 Objetivo del Juego

El juego enfrenta a múltiples jugadores en un terreno generado procedimentalmente. El objetivo es simple: acabar con la vida de todos los tanques rivales usando tus proyectiles. ¡El último tanque en pie será el ganador!

---

## 🕹️ Controles

Puedes jugar tanto con teclado como con ratón.

### Movimiento y Apuntado

* **`A` / `D`** o **`Flechas Izquierda / Derecha`**:
  * *En Modo Movimiento:* Desplaza tu tanque a través de las colinas del terreno.
  * *En Modo Apuntado:* Sube o baja la inclinación del cañón.
* **`Rueda del Ratón`**: Ajusta rápidamente la inclinación del cañón (solo disponible en Modo Apuntado).

### Acciones

* **`ESPACIO`** o **`Clic Derecho`**: Alterna entre el **Modo Movimiento** y el **Modo Apuntado**.
* **`Flecha Arriba`** o **`Clic Izquierdo`**: Dispara el proyectil.
* **`Arrastrar el Ratón`**: Ajusta la fuerza del disparo usando el **Slider de Potencia** (barra vertical) situado en la parte izquierda de la pantalla.
* **`Botón ESCUDO`**: Renuncia al disparo y activa una defensa especial que reduce drásticamente el daño recibido y finaliza el turno.
* **`Botón SALTAR TURNO`**: Finaliza el turno actual sin realizar ninguna acción.
* **`R`**: Reinicia la partida en cualquier momento.

### Gestión de Cámara

* **Botones `+` / `-`**: Aumentan o disminuyen el nivel de zoom.
* **Botones `<` / `>`**: Permiten desplazar la cámara lateralmente de forma manual.
* **Botón `CENTRAR`**: Enfoca la cámara de nuevo en el tanque que tiene el turno actual.

---

## ⚙️ Mecánicas de Juego

### 1. Modos del Tanque

Durante tu turno, tu tanque puede estar en dos estados distintos:

* **Modo Movimiento**: Te permite posicionarte en un lugar ventajoso.
* **Modo Apuntado**: El tanque se ancla al suelo para prepararse para disparar. En este modo aparecerá una **guía de trayectoria (puntos)** que te indicará la fuerza y dirección inicial de la bala.

### 2. Combustible y Energía
* El movimiento consume **combustible** (máximo 150 unidades por turno). 
* Al agotarse el combustible, el tanque no podrá desplazarse más hasta el siguiente turno.

### 3. Sistema de Turnos y Tiempo
* El juego es estrictamente por turnos e incluye un **temporizador** en la parte superior.
* Si el tiempo se agota, el turno pasará automáticamente al siguiente jugador.

### 4. Destrucción del Terreno
* Los proyectiles no solo dañan a los enemigos, sino que también destruyen el mapa creando **cráteres** realistas que afectan al movimiento y la visibilidad.

### 5. Daño y Supervivencia
* **Salud Inicial:** Todos los tanques comienzan con **100 Puntos de Vida (HP)**.
* **Impactos:** Un impacto directo resta **25 HP**.
* **Escudo:** Al activar el escudo, el daño recibido se reduce en un **75%**. La barra de salud se volverá azul para indicar que la protección está activa.
* **Caídas al Vacío:** Si tu tanque cae por los límites del mapa, será destruido instantáneamente.

### 6. Inteligencia Artificial (IA)
Existen tres niveles de dificultad para los oponentes controlados por la CPU:
* **Nivel 1:** Movimientos erráticos y puntería básica.
* **Nivel 2:** Busca mejores posiciones y ajusta su potencia según impactos previos.
* **Nivel 3:** IA avanzada que realiza simulaciones de tiro, busca cobertura, evita cráteres y prioriza objetivos con poca vida.

---

## 🛠️ Tecnologías Usadas

Desarrollado con **TypeScript** y el motor gráfico **Phaser 3** usando el sistema de físicas avanzadas **Matter.js** para calcular colisiones realistas, tracción y deformación del terreno.