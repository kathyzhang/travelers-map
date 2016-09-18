file_r = open("types.txt", "rw+")
file_w = open('typeList','w')

result = ""

for line in file_r:
    result += "<option>" + line.strip('\n') + "</option>\n"

file_w.write(result)

file_r.close()
file_r.close()
