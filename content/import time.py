import time
 
e = input("Name>")
do = open("test2.txt","a",encoding="utf-8")  # Datei öffen zum Anhängen
do.write(time.ctime())  # Uhrzeit schreiben
do.write(" - Benutzername:"+e+"\n") # Benutzereingabe schreiben
do.close()  # Datei schließen
print("Uhrzeit in Datei geschrieben")
 
 
do = open("test2.txt","r")
for z in do:
    print(z,end="")
do.close()
 