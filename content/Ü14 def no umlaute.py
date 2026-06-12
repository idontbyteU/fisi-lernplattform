def no_umlaute(s):
    s=s.replace("ä","ae") # Ersetze Umlaute im String
    s=s.replace("Ä","Ae")
    s=s.replace("ö","oe")
    s=s.replace("Ö","Oe")
    s=s.replace("ü","ue")
    s=s.replace("Ü","Ue")
    s=s.replace("ß","ss")
    return s

do =  open("Programmierer-Gedicht.txt","r",encoding="UTF-8")  # Lesevorgang
do2 = open("Programmierer-Gedicht2.txt","w",encoding="UTF-8")# Schreibvorgang
for z in do:
   do2.write(no_umlaute(z)) # Schreiben in konvertierte Datei
do.close()
do2.close()