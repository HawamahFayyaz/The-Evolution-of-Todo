{{/*
Expand the name of the chart.
*/}}
{{- define "hackathon-todo.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "hackathon-todo.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Chart label
*/}}
{{- define "hackathon-todo.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "hackathon-todo.labels" -}}
helm.sh/chart: {{ include "hackathon-todo.chart" . }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/part-of: {{ include "hackathon-todo.name" . }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}

{{/*
Backend labels
*/}}
{{- define "hackathon-todo.backend.labels" -}}
{{ include "hackathon-todo.labels" . }}
app.kubernetes.io/name: {{ .Values.backend.name }}
app.kubernetes.io/component: backend
{{- end }}

{{/*
Backend selector labels
*/}}
{{- define "hackathon-todo.backend.selectorLabels" -}}
app.kubernetes.io/name: {{ .Values.backend.name }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Frontend labels
*/}}
{{- define "hackathon-todo.frontend.labels" -}}
{{ include "hackathon-todo.labels" . }}
app.kubernetes.io/name: {{ .Values.frontend.name }}
app.kubernetes.io/component: frontend
{{- end }}

{{/*
Frontend selector labels
*/}}
{{- define "hackathon-todo.frontend.selectorLabels" -}}
app.kubernetes.io/name: {{ .Values.frontend.name }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Secret name
*/}}
{{- define "hackathon-todo.secretName" -}}
{{ include "hackathon-todo.fullname" . }}-secrets
{{- end }}

{{/*
Backend ConfigMap name
*/}}
{{- define "hackathon-todo.backend.configmapName" -}}
{{ include "hackathon-todo.fullname" . }}-backend-config
{{- end }}

{{/*
Frontend ConfigMap name
*/}}
{{- define "hackathon-todo.frontend.configmapName" -}}
{{ include "hackathon-todo.fullname" . }}-frontend-config
{{- end }}
