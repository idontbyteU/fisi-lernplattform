def verdoppeln(liste):
    liste2=[]
    for z in liste:
        liste2.append(2*z)
    return liste2

def rrotate(liste, n):
    for i in range(n):
        temp=liste.pop()
        liste.insert(0,temp)
    return liste

def to_strings(liste):
    liste2=[]
    for z in liste:
        liste2.append(str(z))
    return liste2

def over_mean(liste):
    mean=sum(liste)/len(liste)  # Mittelwert
    liste2=[]
    for z in liste:
        if z>mean: liste2.append(z)
    return liste2

def is_sorted(liste):
    return (liste == sorted(liste))  # Boolescher Wert

def unique(liste):
    return list(set(liste))  # Umwandlung in Set, anschließen Umwandlung Liste

#print(verdoppeln([1,3,5]))
#print(rotate([1,2,3,4,5],2))
#print(to_strings([1,True,3.5]))
#print(over_mean([1,3,4,5,6,7,8,9,10,11,12]))
#print(is_sorted([1,3,4,5,6,7,8,9,10,11,12]))
print(unique([1,1,1,1,2,2,3,4,5,5,6]))