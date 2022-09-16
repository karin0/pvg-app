#!/bin/bash

DIR="/mnt/d/lark/acgn/proj/pvg/pvg"

rm -r build
GENERATE_SOURCEMAP=false yarn build

rm -r "$DIR"/static-old
mv "$DIR"/static "$DIR"/static-old
mv build "$DIR"/static
