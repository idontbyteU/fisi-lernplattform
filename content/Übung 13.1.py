def primetest(z):
    prime = True
    if z <= 1: 
        prime = False
    for i in range(2, int(z**0.5) + 1):
        if z % i == 0:
            prime = False
            break  # Optimierung: Sobald ein Teiler gefunden wurde, können wir abbrechen
    return prime

# Hauptprogramm
produkt = 1

# Schleife für alle Zahlen unter 1000 (von 2 bis 999)
for z in range(2, 1000):
    if primetest(z):
        produkt *= z

print(f"Das Produkt aller Primzahlen unter 1000 ist:\n{produkt}")