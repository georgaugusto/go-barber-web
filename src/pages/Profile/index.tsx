import React, { useCallback, useRef, ChangeEvent } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { FiMail, FiUser, FiLock, FiCamera, FiArrowLeft } from 'react-icons/fi';
import { FormHandles } from '@unform/core';
import { Form } from '@unform/web';
import * as Yup from 'yup';

import api from '../../services/api';

import getValidationErros from '../../utils/getValidationErrors';

import Input from '../../components/Input';
import Button from '../../components/Button';

import { useAuth } from '../../hooks/auth';
import { useToast } from '../../hooks/toast';

import {
  Container,
  Content,
  Avatar,
} from './styles';

interface ProfileFormData {
  name: string;
  email: string;
  old_password: string;
  password: string;
  password_confirmation: string;
}

const SignUp: React.FC = () => {
  const formRef = useRef<FormHandles>(null);
  const { user, updateUser } = useAuth();
  const { addToast } = useToast();

  const history = useHistory();

  const handleSubmit = useCallback(async (data: ProfileFormData) => {
    try {
      formRef.current?.setErrors({});

      const schema = Yup.object().shape({
        name: Yup.string()
          .required('Nome obrigatório'),
        email: Yup.string()
          .required('E-mail obrigatório')
          .email('Digite um e-mail válido'),
        old_password: Yup.string(),
        password: Yup.string().when('old_password', {
          is: value => !!value.length,
          then: Yup.string().required('Nova senha obrigatória'),
          otherwise: Yup.string(),
        }),
        password_confirmation: Yup.string().when('old_password', {
          is: value => !!value.length,
          then: Yup.string().required('Confirmação obrigatória'),
          otherwise: Yup.string(),
        })
        .oneOf([Yup.ref('password')], 'Confirmação incorreta'),
      });

      await schema.validate(data, {
        abortEarly: false,
      });

      const {
        name,
        email,
        old_password,
        password,
        password_confirmation,
      } = data;

      const formData = Object.assign({
        name,
        email,
      }, old_password ? {
        old_password,
        password,
        password_confirmation,
      } : {});

      const response = await api.put('/profile', formData);

      updateUser(response.data);

      history.push('/dashboard');

      addToast({
        type: 'success',
        title: 'Perfil atualizado',
        description: 'Suas informações foram atualizadas com sucesso'
      });
    } catch(err) {
      if(err instanceof Yup.ValidationError) {
        const errors = getValidationErros(err);

        formRef.current?.setErrors(errors);
      }

      addToast({
        type: 'error',
        title: 'Erro ao atualizar perfil',
        description: 'Verifique suas credenciais e tente novamente.',
      });
    }
  }, [addToast, history]);

  const handleAvatarChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if(e.target.files) {
      const data = new FormData();

      data.append('avatar', e.target.files[0]);

      api.patch('/users/avatar', data).then((response) => {
        updateUser(response.data);

        addToast({
          type: 'success',
          title: 'Avatar atualizado',
          description: 'Seu perfil foi atualizado'
        });
      });
    }
  }, [addToast, updateUser]);

  return (
    <Container>
      <header>
        <div>
          <Link to="/dashboard">
            <FiArrowLeft size={20} />
          </Link>
        </div>
      </header>

      <Content>
        <Form ref={formRef} initialData={{
          name: user.name,
          email: user.email
        }} onSubmit={handleSubmit}>
          <Avatar>
            <img src={user.avatar_url} alt={user.name}/>

            <label htmlFor="avatar">
              <FiCamera />

              <input type="file" id="avatar" onChange={handleAvatarChange}/>
            </label>
          </Avatar>

          <h1>Meu perfil</h1>

          <Input
            name="name"
            icon={FiUser}
            type="text"
            placeholder="Nome"
          />

          <Input
            name="email"
            icon={FiMail}
            type="text"
            placeholder="E-mail"
          />

          <Input
            containerStyle={{ marginTop: 24 }}
            name="old_password"
            icon={FiLock}
            type="password"
            placeholder="Senha atual"
          />

          <Input
            name="password"
            icon={FiLock}
            type="password"
            placeholder="Nova senha"
          />

          <Input
            name="password_confirmation"
            icon={FiLock}
            type="password"
            placeholder="Confirmar senha"
          />

          <Button type="submit">
            Confirmar mudanças
          </Button>
        </Form>
      </Content>
    </Container>
  );
}

export default SignUp;
