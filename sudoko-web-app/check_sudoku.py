import random

def is_safe(board, index, value):
    row = index // 9
    col = index % 9

    # Check Row
    row_start = row * 9
    for c in range(9):
        if c != col and board[row_start + c] == value:
            return False

    # Check Col
    for r in range(9):
        idx = r * 9 + col
        if r != row and board[idx] == value:
            return False

    # Check Box
    box_row_start = (row // 3) * 3
    box_col_start = (col // 3) * 3
    for r in range(3):
        r_idx = (box_row_start + r) * 9
        for c in range(3):
            idx = r_idx + (box_col_start + c)
            if idx != index and board[idx] == value:
                return False

    return True

def solve(board, randomize=False):
    def find_empty():
        for i in range(81):
            if board[i] == 0:
                return i
        return -1

    empty_idx = find_empty()
    if empty_idx == -1:
        return True

    numbers = list(range(1, 10))
    if randomize:
        random.shuffle(numbers)

    for val in numbers:
        if is_safe(board, empty_idx, val):
            board[empty_idx] = val
            if solve(board, randomize):
                return True
            board[empty_idx] = 0
            
    return False

# Generate 3 boards and print them
for i in range(3):
    board = [0] * 81
    solve(board, randomize=True)
    print(f"Board {i+1}:", board[:9]) # Print first row
