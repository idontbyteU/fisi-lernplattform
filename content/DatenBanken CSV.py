import csv
überschrift=["Automarke", "Verkaufszahl"]
liste=[["VW",1000],["BMW",2000],["Opel",500],["Aston Martin",250],["Käsewagen",1000]]

datei = open("autos.csv","w",encoding="utf-8") # Datei erzeugen
writer = csv.writer(datei, delimiter=";",lineterminator="\n",quoting=csv.QUOTE_NONNUMERIC)   # Writer Objekt
writer.writerow(überschrift)
writer.writerows(liste)                        # Daten schreiben
datei.close()                                  # Datei schließen

datei = open("autos.csv","r",encoding="utf-8") # Datei lesen
reader = csv.reader(datei, delimiter=";",lineterminator="\n",quoting=csv.QUOTE_NONNUMERIC)   # Reader Objekt
ü = next(reader) # Überschrift auslesen wegen Konvertierung
for z in reader:
    z[1]=int(z[1])  # Umwandlung 2. Spalte in int
    print(f"{z[0]:15} {z[1]:6}") # Tabellendarstellung
datei.close()
 