import csv

# Planeten-Datensätze
merkur = ['Merkur', 0.39, 2440, 0]
venus = ['Venus', 0.72, 6052, 0]
erde = ['Erde', 1.0, 6378, 1]
mars = ['Mars', 1.52, 3397, 2]
jupi = ['Jupiter', 5.2, 71493, 79]
saturn = ['Saturn', 9.54, 60267, 82]
uranus = ['Uranus', 19.19, 25559, 27]
neptun = ['Neptun', 30.07, 24764, 14]

# Tabelle erstellen
planetentabelle = []

planetentabelle.append(merkur)
planetentabelle.append(venus)
planetentabelle.append(erde)
planetentabelle.append(mars)
planetentabelle.append(jupi)
planetentabelle.append(saturn)
planetentabelle.append(uranus)
planetentabelle.append(neptun)

# Überschrift
print(f"{'Planet':<8} | {'AE':>6} | {'Radius':>8} | {'Monde':>5}")
print("-" * 40)

# Ausgabe
for p in planetentabelle:
    print(f"{p[0]:<8} | {p[1]:>6} | {p[2]:>8} | {p[3]:>5}")

# CSV-Datei schreiben
with open("planeten.csv", "w", newline="", encoding="utf-8") as datei:
    writer = csv.writer(datei, delimiter=";")

    # Kopfzeile
    writer.writerow(["Planet", "AE", "Radius", "Monde"])

    # Daten
    for p in planetentabelle:
        writer.writerow(p)

print("\nDatei 'planeten.csv' wurde erstellt.")