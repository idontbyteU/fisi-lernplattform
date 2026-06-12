for i in range(-5,6):
    try:
        print(i,1/i)
    except Exception as fehler:
        print("Was komisches ist passiert, und zwar:", fehler)
 
 
while True:
    try:
        e = int(input("Bitte eine ganze Zahl > 0 eingeben>"))
        break  # Schleife abbrechen wenn Eingabe keinen Fehler hat
    except Exception as fehler:
        print("Bitte keinen Blödsinn eingeben!",fehler)
 
print(e)
 