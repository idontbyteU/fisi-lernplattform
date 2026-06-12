import random
# Schreiben
file = open("zufallszahlen.txt","w", encoding="utf-8")
for i in range(1,100001):
    file.write(str(random.randint(0,999)))
    if i%5==0:
        file.write("\n")
    else:
        file.write("\t")
file.close()

# Lesen
file = open("zufallszahlen.txt","r",encoding="utf-8")
c=0  # Zeilenzähler
for z in file:
    c=c+1
    if c==2389: 
        print(z)
        break
file.close()