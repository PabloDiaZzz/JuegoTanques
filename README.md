# 🎯 Tank Artillery Game

¡Bienvenido a este juego de artillería por turnos estilo "Worms" o "Gunbound"! Controla tu tanque, domina las físicas del terreno, calcula la trayectoria de tus disparos y destruye a tus oponentes antes de que ellos te destruyan a ti.

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
* **`R`**: Reinicia la partida en cualquier momento.

---

## ⚙️ Mecánicas de Juego

### 1. Modos del Tanque

Durante tu turno, tu tanque puede estar en dos estados distintos:

* **Modo Movimiento**: Te permite posicionarte en un lugar ventajoso. Ten en cuenta que los tanques pierden tracción si saltan o caen por pendientes muy pronunciadas.
* **Modo Apuntado**: El tanque se ancla al suelo para prepararse para disparar. En este modo aparecerá una **guía de trayectoria (puntos)** que te indicará la fuerza y dirección inicial de la bala según cómo configures tu potencia y ángulo.

### 2. Sistema de Turnos

* El juego es estrictamente por turnos. Verás de quién es el turno en la esquina superior izquierda.
* Una vez que disparas, no podrás hacer nada más. El turno pasará automáticamente al siguiente jugador cuando tu bala impacte contra un tanque, contra el suelo, o salga de los límites del mapa.

### 3. Daño y Supervivencia

* **Salud Inicial:** Todos los tanques comienzan con **100 Puntos de Vida (HP)**.
* **Impactos:** Acertar un impacto directo con tu proyectil sobre un tanque rival le restará **25 Puntos de Vida**.
* **Caídas al Vacío:** Ten mucho cuidado al moverte por los extremos del mapa. Si tu tanque cae al vacío, recibirá 100 puntos de daño y quedará destruido instantáneamente.

---

## 🛠️ Tecnologías Usadas

Desarrollado con **TypeScript** y el motor gráfico **Phaser 3** usando el sistema de físicas avanzadas **Matter.js** para calcular colisiones realistas y tracción sobre terrenos irregulares.
