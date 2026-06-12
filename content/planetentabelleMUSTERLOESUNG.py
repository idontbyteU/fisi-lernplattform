import csv

merkur = ['Merkur', 0.39, 2440, 0] 
venus = ['Venus', 0.72, 6052, 0] 
erde = ['Erde', 1.0, 6378, 1] 
mars = ['Mars', 1.52, 3397, 2] 
jupi = ['Jupiter', 5.2, 71493, 79] 
saturn = ['Saturn', 9.54, 60267, 82] 
uranus = ['Uranus', 19.19, 25559, 27] 
neptun = ['Neptun', 30.07, 24764, 14] 

pt = [merkur,venus,erde,mars,jupi,saturn,uranus,neptun]
print("| Name   |  Entf.Sonne(AE)|   Radius(km) |Monde|")
print("|--------+----------------+--------------+-----|")
for p in pt:
    print(f"|{p[0]:7} | {p[1]:12}   |   {p[2]:8}   | {p[3]:3} |")

do = open("planeten.csv","w",encoding="utf-8")
writer = csv.writer(do,delimiter=";",lineterminator="\n",quoting=csv.QUOTE_NONNUMERIC)
writer.writerows(pt)
do.close()
 