#!/bin/bash
set -e

export DEBIAN_FRONTEND=noninteractive

LOCALES_PACKAGE="locales"
LOCALE_NAME="${LOCALES:-en_NZ.UTF-8}"

str="Installing ${LOCALE_NAME} locale..."
echo "${str}" | sed "s/./=/g"
echo "${str}"
echo "${str}" | sed "s/./=/g"

apt-get update
apt-get install -y "${LOCALES_PACKAGE}"

locale -a
sed -i "/^# *${LOCALE_NAME}/s/^# //" /etc/locale.gen

locale-gen "${LOCALE_NAME}"

update-locale LANG="${LOCALE_NAME}" || echo "Non-critical failure ignored"

echo "Locale ${LOCALE_NAME} installed successfully."
