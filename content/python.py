
#Verschachtelte If-Anweisung:
#Pseudocode:
#Eingabe: Umsatz
#If Umsatz > 100
#	Dann 
#	If Umsatz > 500
#		Dann Rabatt = 10
#	Sonst Rabatt = 5
#Sonst Rabatt = 0
#Rechnungsbetrag = Umsatz – Rabatt
#Ausgabe rechnungsbetrag

#Python:
umsatz = float(input("Umsatz eingeben: "))
if umsatz > 100:
       	if umsatz > 500:
            rabatt = 10
        else:
            rabatt = 5
else:
    	rabatt = 0
rechnungsbetrag = umsatz - rabatt
print("Rechnungsbetrag:", rechnungsbetrag)


#if/ elif/ else:

#Pseudocode:
#Eingabe Umsatz
#wenn Umsatz > 500 DANN
#    	Rabatt = 10
#sonst 
#wenn Umsatz > 100 DANN
#    		Rabatt = 5
#sonst
#    	Rabatt = 0
#Rechnungsbetrag = Umsatz - Rabatt
#Ausgabe Rechnungsbetrag

#Python:
umsatz = float(input("Umsatz eingeben: "))
if umsatz > 500:
    	rabatt = 10
elif umsatz > 100:
    	rabatt = 5
else:
    	rabatt = 0
rechnungsbetrag = umsatz - rabatt
print("Rechnungsbetrag:", rechnungsbetrag)

#match case:
umsatz = float(input("Umsatz eingeben: "))
match umsatz:
    case 1 if umsatz > 500:
        		rabatt = 10
    case 2 if umsatz > 100:
        		rabatt = 5
    case 3:
        		rabatt = 0
rechnungsbetrag = umsatz - rabatt
print("Rechnungsbetrag:", rechnungsbetrag)
