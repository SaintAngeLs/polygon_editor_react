# Polygon Editor React

### Table of contents

-   About
-   Specification (pl)
-   Getting started
-   Components
-   How to run locally
-   Contribution

## About

React Polygon Editor provides react components for displaying and editing polygons.
We use leaflet for rendering maps. And typescript to provide a strongly typed interface.

## Specification (pl)

- [x] Możliwość dodawania nowego wielokąta, usuwania oraz edycji
- [x] Przy edycji:
   - [x] przesuwanie wierzchołka(klikanie na wirszhołek i zmiana jego położenia myszą)
   - [x] usuwanie wierzchołka (klikanie na wirzhołek i na klinakanie "usunąć" na komponencie ActionBar)
   - [x] dodawanie wierzchołka w środku wybranej krawędzi (przejście w stan wektorowy (`p` na klawiaturze, czy nacisnąć myszą na pioro na komponencie AcrionBar) i zatem naciśnięćie "+" na ActionBar)
   - [x] przesuwanie całej krawędzi (kliknąć na jeden wierzchołek wybranej krawędzi, trzymająć `shift` na klawiaturze, wybrać inny wirzhołek wybranej krawędzi)
   - [x] przesuwanie całego wielokąta (nacisnąć `a` na klawiaturze, i przeniść wielokąt ciągnąć za dowolny wirzchołek)
- [x] Dodawanie ograniczeń (relacji) dla wybranej krawędzi (wybranie kawędzi(w stanie wektorowym nacisność za średni punkt na krawędzi) i na komponencie EdgeCibstraintsBar wybrać żądane odgranicznie):
   - [x] możliwe ograniczenia:
      - [x] krawędź pozioma, krawędź pionowa
      - [x] dwie sąsiednie krawędzie nie mogą być obie pionowe lub obie poziome
      - [x] dodawanie wierzchołka na krawędzi lub usuwanie wierzchołka - usuwa ograniczenia "przyległych" krawędzi
      - [x] ustawione ograniczenia są widoczne (jako odpowiednie "ikonki") przy środku krawędzi
      - [x] powinna istnieć mozliwość usuwania relacji
- [x] Włączanie/wyłączanie wielokąta odsuniętego.
   - [x] dla prawidłowego wielokąta (zamknięta łamana bez samoprzecięć) - wielokąt odsunięty nie ma samoprzecięć!
   - [x] może istnieć kilka składowych (spójnych) wielokąta odsuniętego
   - [x] możliwość płynnej zmiany offsetu (tylko dodatni)
   - [x] płynna aktualizacja wielokąta oduniętego podczas modyfikacji wielokąta
   - [x] Rysowanie odcinków - algorytm biblioteczny i własna implementacja (alg. Bresenhama) - radiobutton
- [x] Definiowanie nowego wielokąta oraz przesuwanie - jak najbardziej intuicyjne
- [x] !!!Predefiniowana scena (min 2 wielokąty) z ograniczeniami (funkcionalności `import` i `export`(`export` - wyłącznie w GeoJSON))(3 sceny: domyślna, wilokąty mnogościowe, i rysowanie nowego wielokąta)
Proszę również o przygotowanie prostej dokumentacji (może być w notatniku) zawierającej:
   - [x] instrukcji obsługi - "klawiszologia"
   - [x] przyjętych założeń i opisu zaimplementowanego algorytmu "relacji" oraz wyznaczania wielokąta odsuniętego

Termin oddania zadania - tydzień: 24,25 października, 2 listopada. W trakcie tych zajęć - część laboratoryjna.


## DEV Specification (pl)

- [x] Możliwość dodawania nowego wielokąta, usuwania oraz edycji
- [x] Przy edycji:
   - [x] przesuwanie wierzchołka
   - [x] usuwanie wierzchołka
   - [x] dodawanie wierzchołka w środku wybranej krawędzi
   - [x] przesuwanie całej krawędzi
   - [x] przesuwanie całego wielokąta
- [ ] Dodawanie ograniczeń (relacji) dla wybranej krawędzi:
   - [ ] możliwe ograniczenia:
      - [X] krawędź pozioma, krawędź pionowa
      - [X] dwie sąsiednie krawędzie nie mogą być obie pionowe lub obie poziome
      - [X] dodawanie wierzchołka na krawędzi lub usuwanie wierzchołka - usuwa ograniczenia "przyległych" krawędzi
      - [X] ustawione ograniczenia są widoczne (jako odpowiednie "ikonki") przy środku krawędzi
      - [X] powinna istnieć mozliwość usuwania relacji
- [ ] Włączanie/wyłączanie wielokąta odsuniętego.
   - [X] dla prawidłowego wielokąta (zamknięta łamana bez samoprzecięć) - wielokąt odsunięty nie ma samoprzecięć!
   - [X] może istnieć kilka składowych (spójnych) wielokąta odsuniętego
   - [X] możliwość płynnej zmiany offsetu (tylko dodatni)
   - [X] płynna aktualizacja wielokąta oduniętego podczas modyfikacji wielokąta
   - [X] Rysowanie odcinków - algorytm biblioteczny i własna implementacja (alg. Bresenhama) - radiobutton
- [x] Definiowanie nowego wielokąta oraz przesuwanie - jak najbardziej intuicyjne
- [x] !!!Predefiniowana scena (min 2 wielokąty) z ograniczeniami
Proszę również o przygotowanie prostej dokumentacji (może być w notatniku) zawierającej:
   - [X] instrukcji obsługi - "klawiszologia"
   - [] przyjętych założeń i opisu zaimplementowanego algorytmu "relacji" oraz wyznaczania wielokąta odsuniętego

## Getting started

### Prerequisites
 - Make sure you have Node.js and npm installed on your machine. You can download the latest version of Node.js, which includes npm, from the official Node.js website.
 - nvm (Node Version Manager) is optional but recommended to manage multiple Node.js versions.
,

First install the main project with the standart procedure:

```bash
nvm use 18 && npm install
```

Make sure you have also installed all peer dependencies. Have a look at [package.json](package.json) for more information.

Actualy the nice decission of the installation instruction would be to run the following:
```bash
npm i -S react react-dom react-leaflet leaflet styled-components
```


Also, the one nice solution of the adding the own styling to the leafles component: linking the css style from a CDN in your index.html

```html
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.4.0/dist/leaflet.css" />
```

## Components

### PolygonDraw

**Props**

-   **polygon**: _Coordinate[] | Coordinate[][]_ (Single or list of polygons to render)
-   **activeIndex**?: _number_ (index of currently active polygon, can be omitted when only one polygon exists. **Default value: 0**)
-   **highlightedIndex**?: _number_ (index of the polygon that should be highlighted.)
-   **boundary**?: _Coordinate[]_
-   **initialCenter**?: _Coordinate_ (The initial center will be used to localize the map on the first render if no polygon or boundary polygon were provided)
-   **initialZoom**?: _number_ (The initial zoom will be used to localize the map on the first render if no polygon or boundary polygon were provided)
-   **editable**?: _boolean_ (Allows enabling and disabling polygon editing. **Default value: true**)
-   **onChange**?: _(polygonCoordinates: Coordinate[], isValid: boolean) => void_
-   **onClick**?: _(index: number) => void_ (called with the index of the polygon that was clicked on)
-   **onMouseEnter**?: _(index: number) => void_ (called with the index of the polygon that was entered)
-   **onMouseLeave**?: _(index: number) => void_ (called with the index of the polygon that was left)


## Skróty klawiszowe

Dla wybrania wielokątu, proszę nacisnąć myszką na wielokąt. Dla dodania nowego poligonu: eksport (przykład przykładowego pliku dla następnego importu, znajduje się w katalogu głównym projektu; import na tym etapie implementacji projektu wspiera wyłącznie GeoJSON).

- `Backspace`: Usuń zaznaczone punkty lub poligony.
- `Shift`: (Przytrzymaj) Włącz zaznaczanie wielu punktów.
- `p`: Przełącz tryb wektorowy.
- `d`: Odznacz wszystkie punkty (w trybie edycji).
- `a`: Zaznacz wszystkie punkty (w trybie edycji).
- `f`: Reframe - Dostosuj mapę tak, aby pasowała do wszystkich poligonów.
- `z`: Cofnij (z `Cmd`/`Ctrl`) lub Przywróć (z `Cmd`/`Ctrl` + `Shift`).

## Wyjaśnienie Algorytmu Bresenhama oraz przyjęte założenia 
Algorytm Bresenhama jest implementowany w celu narysowania linii między dwoma punktami w sposób optymalizujący liczbę punktów na linii. Funkcja bresenhamLine(x0, y0, x1, y1) przyjmuje punkt początkowy (x0, y0) oraz punkt końcowy (x1, y1) jako parametry.

Ta implementacja została dostosowana do obsługi współrzędnych geograficznych (szerokość i długość geograficzna), ustawiając mały krok. Jednakże, ze względu na wysoką precyzję współrzędnych geograficznych, musimy ograniczyć liczbę iteracji, aby zapobiec nieskończonej pętli i zapewnić wydajność algorytmu względem procesu renderingu podczas uruchamiania wszystkich szczególnych komponentów (bardziej dokłądną informację istnieje szansa znależć w dokumentacji technicznej pod tytułami Node.js event loop, React.Dom, React.render()).

Zmienna maxIterations jest ustawiona w celu ograniczenia liczby punktów na linii, zapobiegając problemom z wydajnością i niereagowaniem przeglądarki. Zmienna epsilon zapewnia, że nie napotkamy problemów z precyzją liczby zmiennoprzecinkowej.

## Algorytm Wyznaczania Wielokąta Odsuniętego
Algorytm ten wykorzystuje operacje na współrzędnych geograficznych do stworzenia bufora wokół istniejącego wielokąta, co pozwala na "odsunięcie" jego krawędzi o określoną odległość. W zależności od wartości odległości, wynikowy wielokąt może być powiększony, pomniejszony, lub pozostać niezmieniony.

### Procedura:
 
1. Wielokąt jest reprezentowany jako zestaw współrzędnych geograficznych.
2. Dla każdego punktu wielokąta obliczana jest nowa pozycja, uwzględniając zadaną odległość odsunięcia.
3. Nowe współrzędne są łączone, tworząc odsunięty wielokąt.
4. Wielokąt jest renderowany na componencie rozszerzonej mapy.

## Algorytm relacji: Przyjęte Założenia

 - Dane Wejściowe: Algorytm przyjmuje jako dane wejściowe zbiór punktów lub wierzchołków, które razem tworzą wielokąt.
 - Relacja: W kontekście tego algorytmu, relacja oznacza zależność pomiędzy krawędziami wielokąta, a jego zmodyfikowaną wersją (wielokątem odsuniętym).
 - Odsunięty(Offset) Wielokąt: Wielokąt odsunięty to wielokąt powstały przez przesunięcie krawędzi oryginalnego wielokąta o pewną stałą wartość.

### Opis Algorytmu "Relacji"

1. Przygotowanie Danych

Algorytm rozpoczyna od przygotowania danych:

 - Wyznaczenie wszystkich krawędzi wielokąta na podstawie jego wierzchołków.
 - Przygotowanie struktury do przechowywania relacji pomiędzy krawędziami oryginalnego wielokąta a krawędziami wielokąta odsuniętego.

2. Wyznaczanie Relacji

Dla każdej krawędzi oryginalnego wielokąta algorytm wykonuje następujące kroki:

 - Obliczenie Wektora Normalnego: Na podstawie krawędzi obliczany jest wektor normalny, który jest prostopadły do tej krawędzi.
 - Normalizacja Wektora: Wektor normalny jest normalizowany, aby miał długość równą odległości, o którą chcemy odsunąć krawędź.
 - Przesunięcie Punktów: Punkty końcowe krawędzi są przesuwane wzdłuż wektora normalnego, tworząc nową krawędź.
 - Zapisanie Relacji: W strukturze przechowującej relacje zapisywana jest informacja o powiązaniu krawędzi oryginalnego wielokąta z krawędzią wielokąta odsuniętego.
3. Wyznaczanie Wielokąta Odsuniętego

   Na podstawie zapisanych relacji tworzony jest wielokąt odsunięty:

 - Dla każdej krawędzi oryginalnego wielokąta, na podstawie zapisanej relacji, wybierana jest odpowiadająca jej krawędź w wielokącie odsuniętym.
 - Krawędzie te są łączone ze sobą w taki sposób, aby zachować spójność i kształt wielokąta.
4. Ostateczne Przetworzenie Danych
 - W zależności od potrzeb, algorytm może na końcu przetworzyć dane wyjściowe, np. dokonać dodatkowej weryfikacji, czy wielokąt odsunięty jest poprawnie zdefiniowany, czy nie występują w nim samoprzecięcia itp.

## How to run locally

Dla wizualizacji (localnego 'IDE') został wykorzystany [storybook](https://storybook.js.org/).

Simply run:

```bash
npm install && npm start
```

