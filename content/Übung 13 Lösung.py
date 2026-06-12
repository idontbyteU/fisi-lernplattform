def primetest(z):
    prime=True
    if z<=1: prime=False
    for i in range(2, int(z**0.5)+1):
        if z%i==0:
            prime=False
            return prime
    return prime
 
count=0
test=2
while count<200:
    if primetest(test):
        print(test, end=" ")
        count=count+1
    test=test+1