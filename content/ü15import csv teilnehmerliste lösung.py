import csv
 
do = open("teilnehmer.csv","r",encoding="utf-8")
reader=csv.reader(do,delimiter=";")
ü=next(reader)
tnliste=list(reader)  # Kopie des reader als Liste
do.close()
c = 0
for t in tnliste:
    if t[2]=="Python Grundlagen":
        print(f"{t[1]:6} {t[0]:10} - {t[2]}")
        c+=1
print("Anzahl Teilnehmer:",c)
 
print()
c=0
for t in tnliste:
    print(f"{t[1]:6} {t[0]:10} - {t[2]}")
    c+=1
print("Anzahl Teilnehmer:",c)
 
do.close()