import re
import os

text = "(20㎡)⊙3=17을 만족하는 의 값을 구하시오.\nX=3"

ignore_word = '구하시오.\n'

# text에서 ignore_word이후 문자열 선택
ignore_word_index = text.find(ignore_word)
text = text[ignore_word_index + len(ignore_word):]

print(text)