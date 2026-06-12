def primtest(z):
    prime=True
    if z<=1: prime=False
    for i in range(2, int(z**0.5)+1):
        if z%i==0:
            prime=False
            return prime
    return prime

print(primtest(1))

